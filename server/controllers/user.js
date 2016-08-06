import User from '../models/user';
import { sign } from 'jsonwebtoken';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import { secret } from '../../config/env';
import * as consts from '../../config/consts';

/**
 * Login User
 * @returns {User}
 */
function login(req, res, next) {
  User.findOne({ username: req.body.username }).then(user =>	{
    if (!user) {
      throw new APIError(
        consts.LOGIN_FAIL,
        'Username or password invalid.',
        httpStatus.NOT_FOUND,
        true
       );
    }
    return user.comparePassword(user.password, req.body.password).then(isMatch => {
      if (!isMatch) {
        throw new APIError(
          consts.LOGIN_FAIL,
          'Username or password invalid.',
          httpStatus.NOT_FOUND,
          true
        );
      }
      return sign(user.username, secret, { expiresIn: consts.JWT_EXPIRES_IN });
    });
  }).then(token => {
    res.json({
      code: consts.LOGIN_SUCCESS,
      status: 'success',
      data: token
    });
  }).catch(e => next(e));
}

/**
 * Create new user
 * @property {string} req.body.fullname - The user's fullname
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.password - The user's password.
 * @property {url} req.body.website - The user's website.
 * @property {biography} req.body.biography - The user's biography
 * @property {email} req.body.email - The user's email
 * @property {mobileNumber} req.body.mobileNumber - The user's mobileNumber
 * @returns {User}
 */
function create(req, res, next) {
  const user = new User({
    fullname: req.body.fullname,
    username: req.body.username,
    password: req.body.password,
    website: req.body.website,
    biography: req.body.biography,
    email: req.body.email,
    mobileNumber: req.body.mobileNumber
  });

  User.findOne({ email: user.email }).then(savedUser =>	{
    if (savedUser) {
      throw new APIError(
        consts.USER_ALREDY_EXISTS,
        'User alredy exists',
        httpStatus.BAD_REQUEST,
        true
      );
    }
    return user.saveAsync();
  }).then(savedUser => {
    res.json({
      code: consts.CREATE_USER_SUCCESS,
      status: 'success',
      data: savedUser
    });
  }).catch(e => next(e));
}


/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id).then((user) => {
    if (!user) {
      throw new APIError(consts.USER_NOT_FOUND, 'User not found', httpStatus.NOT_FOUND, true);
    }
    req.user = user;		// eslint-disable-line no-param-reassign
    return next();
  }).catch(e => {
    next(new APIError(consts.USER_NOT_FOUND, 'User not found', httpStatus.NOT_FOUND, true));
    console.log(e);
  });
}

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.json({
    code: consts.USER_FOUND,
    status: 'success',
    data: req.user
  });
}

/**
 * Update existing user
 * @property {string} req.body.fullname - The user's fullname
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.password - The user's password.
 * @property {url} req.body.website - The user's website.
 * @property {biography} req.body.biography - The user's biography
 * @property {email} req.body.email - The user's email
 * @property {mobileNumber} req.body.mobileNumber - The user's mobileNumber
 * @property {createdAt} req.body.createdAt - The user's createdAt
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.user;
  user.fullname = req.body.fullname;
  user.username = req.body.username;
  user.password = req.body.password;
  user.website = req.body.website;
  user.biography = req.body.biography;
  user.email = req.body.email;
  user.mobileNumber = req.body.mobileNumber;
  user.createdAt = req.body.createdAt;

  user.saveAsync()
    .then((savedUser) => res.json({
      code: consts.UPDATE_USER_SUCCESS,
      status: 'success',
      data: savedUser
    }))
    .catch(e => {
      next(new APIError(
        consts.UPDATE_USER_FAIL,
        'User update failed',
        httpStatus.INTERNAL_SERVER_ERROR,
        true
      ));
      console.log(e);
    });
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  User.list({ limit, skip }).then((users) =>	res.json(users))
    .error((e) => next(e));
}

/**
 * Delete user.
 * @returns {User}
 */
function remove(req, res, next) {
  const user = req.user;
  user.removeAsync()
    .then((deletedUser) => res.json({
      code: consts.USER_DELETED,
      status: 'success',
      data: deletedUser
    }))
    .catch((e) => next(e));
}

export default { load, get, create, update, list, remove, login };