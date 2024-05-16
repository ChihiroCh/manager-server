const router = require('koa-router')();
const util = require('../utils/utils');
const Dept = require('../models/deptSchema');

router.prefix('/dept');
// 菜单列表
router.get('/list', async ctx => {
  const { deptName } = ctx.request.query;
  try {
    let params = {};
    if (deptName) params.deptName = deptName;
    let rootList = (await Dept.find(params)) || [];
    console.log('dept rootList', rootList);
    if (deptName) {
      ctx.body = util.success(rootList);
    } else {
      let list = getTreeMenu(rootList, null, [], params.deptName);
      ctx.body = util.success(list);
    }
  } catch (error) {
    ctx.body = util.fail(`查询失败${error.stack}`);
  }
});
// 递归拼接树形列表
function getTreeMenu(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i];
    // 通过id与当前项的parentId存的父节点id比较，存到父节点的children
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc);
    }
  }
  list.map(item => {
    item.children = [];
    getTreeMenu(rootList, item._id, item.children);
    if (item.children.length == 0) {
      delete item.children;
    } else if (item.children.length > 0 && item.children[0].menuType == 2) {
      // 快速区分按钮和菜单，用于后期做菜单按钮权限控制
      item.action = item.children;
    }
  });
  return list;
}

// 部门增加、删除、编辑

router.post('/operate', async ctx => {
  const { _id, action, ...params } = ctx.request.body;
  let res, info;
  try {
    if (action == 'create') {
      res = await Dept.create(params);
      info = '创建成功';
    } else if (action == 'edit') {
      params.updateTime = new Date();
      // console.log(_id);
      await Dept.findByIdAndUpdate(_id, params);
      info = '编辑成功';
    } else {
      await Dept.findByIdAndRemove(_id);
      await Dept.deleteMany({ parentId: { $all: [_id] } });
      info = '删除成功';
    }
    ctx.body = util.success({}, info);
  } catch (error) {
    ctx.body = util.fail({}, error.stack);
  }
});

module.exports = router;
