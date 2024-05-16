const router = require('koa-router')();
const util = require('../utils/utils');
const Role = require('../models/roleSchema');

router.prefix('/roles');
// 用户列表
router.get('/allList', async ctx => {
  try {
    const list = await Role.find({}, '_id roleName');
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(`查询失败${error.stack}`);
  }
});
// 菜单列表
router.get('/list', async ctx => {
  const { roleName } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  try {
    let parmas = {};
    if (roleName) parmas.roleName = roleName;
    const query = Role.find(parmas);
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await Role.countDocuments(parmas);
    ctx.body = util.success({
      list,
      page: {
        ...page,
        total
      }
    });
  } catch (error) {
    ctx.body = util.fail(`查询失败${error.stack}`);
  }
});
// 递归拼接树形列表
// function getTreeMenu(rootList, id, list, menuName = null) {
//   for (let i = 0; i < rootList.length; i++) {
//     let item = rootList[i];
//     // 通过id与当前项的parentId存的父节点id比较，存到父节点的children
//     if (String(item.parentId.slice().pop()) == String(id) || menuName) {
//       list.push(item._doc);
//     }
//   }
//   list.map(item => {
//     item.children = [];
//     getTreeMenu(rootList, item._id, item.children);
//     if (item.children.length == 0) {
//       delete item.children;
//     } else if (item.children.length > 0 && item.children[0].menuType == 2) {
//       // 快速区分按钮和菜单，用于后期做菜单按钮权限控制
//       item.action = item.children;
//     }
//   });
//   return list;
// }

// 角色增加、删除、编辑
router.post('/operate', async ctx => {
  const { _id, action, roleName, remark } = ctx.request.body;
  let res, info;

  try {
    if (action == 'create') {
      res = await Role.create({ roleName, remark });
      info = '创建成功';
    } else if (action == 'edit') {
      if (_id) {
        let params = { roleName, remark };
        params.updateTime = new Date();
        // console.log(_id);
        res = await Role.findByIdAndUpdate(_id, params);
        info = '编辑成功';
      } else {
        ctx.body = util.fail(`缺少参数params:_id`);
        return;
      }
    } else {
      if (_id) {
        res = await Role.findByIdAndDelete(_id);
        info = '删除成功';
      } else {
        ctx.body = util.fail(`删除失败`);
        return;
      }
    }
    ctx.body = util.success(res, info);
  } catch (error) {
    ctx.body = util.fail(`操作失败${error.stack}`);
  }
});

// 权限设置
router.post('/update/permission', async ctx => {
  const { _id, permissionList } = ctx.request.body;
  try {
    let params = { permissionList, updateTime: new Date() };
    let res = await Role.findByIdAndUpdate(_id, params);
    ctx.body = util.success(res, '权限设置成功');
  } catch (error) {
    ctx.body = util.fail('权限设置失败');
  }
});

module.exports = router;
