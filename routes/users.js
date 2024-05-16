const router = require('koa-router')();
const User = require('../models/userSchema');
const util = require('../utils/utils');
const jwt = require('jsonwebtoken');
const Counter = require('../models/countSchema');
const Menu = require('../models/menuSchema');
const Role = require('../models/roleSchema');
const md5 = require('md5');

router.prefix('/users');

router.post('/login', async ctx => {
  try {
    const { userName, userPwd } = ctx.request.body;
    // console.log('object res', ctx.request.body);
    let res = await User.findOne(
      { userName, userPwd: md5(userPwd) },
      'userId userName userEmail state role deptId roleList'
    );
    if (!res) {
      res = await User.findOne(
        { userName, userPwd: userPwd },
        'userId userName userEmail state role deptId roleList'
      );
    }
    if (res) {
      const data = res._doc;
      const token = jwt.sign(
        {
          data
        },
        'chihiro',
        { expiresIn: '1h' }
      );
      data.token = token;
      ctx.body = util.success(res);
    } else {
      ctx.body = util.fail('用户名或者密码不正确');
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
});

// 权限列表
router.get('/getPremissionList', async ctx => {
  let authorization = ctx.request.headers.authorization;
  let { data } = util.decoded(authorization);
  let menuList = await getMenuList(data.role, data.roleList);
  let actionList = getActionList(JSON.parse(JSON.stringify(menuList)));
  ctx.body = util.success({ menuList, actionList });
});
async function getMenuList(userRole, roleKeys) {
  let rootList = [];
  if (userRole == 0) {
    rootList = (await Menu.find({})) || [];
  } else {
    let roleList = await Role.find({ _id: { $in: roleKeys } });
    let permissionList = [];
    roleList.map(role => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList;
      permissionList = permissionList.concat(
        ...checkedKeys,
        ...halfCheckedKeys
      );
    });
    permissionList = [...new Set(permissionList)];
    rootList = await Menu.find({ _id: { $in: permissionList } });
  }
  return util.getTree(rootList, null, []);
}
// 递归遍历
function getActionList(list) {
  const actionList = [];
  const deep = arr => {
    while (arr.length) {
      let item = arr.pop();
      if (item.action) {
        item.action.map(action => {
          actionList.push(action.menuCode);
        });
      }
      if (item.children && !item.action) {
        deep(item.children);
      }
    }
  };
  deep(list);

  return actionList;
}

// 所有用户
router.get('/all/list', async ctx => {
  try {
    const list = await User.find({}, 'userId userName userEmail');
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});
// 用户列表
router.get('/list', async ctx => {
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  let params = {};
  if (userId) params.userId = userId;
  if (userName) params.userName = userName;
  if (state && state != '0') params.state = state;
  try {
    const query = User.find(params, { _id: 0, userPwd: 0 });
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await User.countDocuments(params);
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    });
  } catch (error) {
    ctx.body = util.fail(`查询异常${error.stack}`);
  }
});

// 用户删除
router.post('/delete', async ctx => {
  const { userIds } = ctx.request.body;
  try {
    const res = await User.updateMany(
      { userId: { $in: userIds } },
      { state: 2 }
    );
    if (res.modifiedCount > 0) {
      ctx.body = util.success(res, `共删除成功${res.modifiedCount}条`);
      return;
    }
  } catch (error) {
    ctx.body = util.fail('删除失败');
  }
});

router.post('/operate', async ctx => {
  const {
    action,
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId
  } = ctx.request.body;
  if (action === 'add') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR);
      return;
    }
    // 查询是否重复添加
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }] },
      '_id userName userEmail'
    );
    if (res) {
    } else {
      try {
        const doc = await Counter.findOneAndUpdate(
          { _id: 'userId' },
          { $inc: { sequence_value: 1 } }
        );
        const addUser = new User({
          userId: doc.sequence_value,
          userName,
          userEmail,
          mobile,
          job,
          userPwd: md5('123456'),
          role: 1,
          state,
          roleList,
          deptId
        });
        addUser.save();
        ctx.body = util.success({}, '用户创建成功');
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败');
      }
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR);
      return;
    }
    try {
      const res = await User.findOneAndUpdate(
        { userId },
        { mobile, job, state, roleList, deptId }
      );
      ctx.body = util.success(res, '更新成功');
      return;
    } catch (error) {
      ctx.body = util.fail('更新失败');
    }
  }
});

module.exports = router;
