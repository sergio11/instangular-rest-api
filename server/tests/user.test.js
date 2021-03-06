import request from 'supertest-as-promised';
import User from '../models/user';
import httpStatus from 'http-status';
import chai from 'chai';
import { expect } from 'chai';
import app from '../app';
import * as codes from '../codes/';
import { secret, fbToken, fbID, activateToken, resetPasswordToken } from '../../config/env';
import { sign } from 'jsonwebtoken';

chai.config.includeStack = false;

const user = {
  fullname: 'Sergio Sánchez Sánchez',
  username: 'Sergio11',
  password: 'sergio11Bisite',
  biography: 'Sergio es DIOS',
  email: 'sss4esob@gmail.com',
  mobileNumber: '673557695'
};

const anotherUser = new User({
  fullname: 'Álvaro Miguel Pérez',
  username: 'al88atomic',
  password: '1234fuego',
  biography: 'Álvaro ia a ....',
  email: 'al88atomic@gmail.com',
  mobileNumber: '673445695',
  active: 1
});


describe('## User APIs', () => {
  before(() => anotherUser.saveAsync().then(savedUser => {
    anotherUser._id = savedUser._id;
    return savedUser;
  }));

  describe('# POST /api/v1/accounts/signup', () => {
    it('should create a new user', (done) => {
      request(app)
        .post('/api/v1/accounts/signup')
        .send(user)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.CREATE_USER_SUCCESS);
          expect(res.body.status).to.equal('success');
          expect(res.body.data.id).to.have.lengthOf(24);
          expect(res.body.data.message)
            .to
            .equal('User successfully registered, check your email for more information');
          user._id = res.body.data.id;
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should not create a new user', (done) => {
      request(app)
        .post('/api/v1/accounts/signup')
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_ALREDY_EXISTS);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('User alredy exists');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should handle express validation error - name, fullname, email is required', (done) => {
      request(app)
        .post('/api/v1/accounts/signup')
        .send({
          mobileNumber: '673445695'
        })
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.code).to.equal(codes.VALIDATION_ERROR);
          expect(res.body.message)
            .to
            .equal('"fullname" is required and "username" is required and "email" is required');
          done();
        });
    });
  });

  describe('# POST /api/v1/accounts/signin', () => {
    it('should not authenticate the user - Username incorrect', (done) => {
      request(app)
        .post('/api/v1/accounts/signin')
        .send({
          username: 'marcos',
          password: 'sergio11Bisite'
        })
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.code).to.equal(codes.LOGIN_FAIL);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('Username or password invalid.');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should not authenticate the user - The account is disabled', (done) => {
      request(app)
        .post('/api/v1/accounts/signin')
        .send({
          username: 'Sergio11',
          password: 'sergio11Bisite'
        })
        .expect(httpStatus.FORBIDDEN)
        .then(res => {
          expect(res.body.code).to.equal(codes.ACCOUNT_DISABLED);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('The account is disabled');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should not activate account - token length must be 16 characters long', (done) => {
      request(app)
        .get(`/api/v1/accounts/confirm/0123456789abcdefghijklmnopqrstuvw`)
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.code).to.equal(codes.VALIDATION_ERROR);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('"token" length must be 16 characters long');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should activate account', (done) => {
      request(app)
        .get(`/api/v1/accounts/confirm/${activateToken}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.ACCOUNT_ACTIVATED);
          expect(res.body.status).to.equal('success');
          expect(res.body.data).to.equal('The account was successfully activated');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should not authenticate the user - password incorrect', (done) => {
      request(app)
        .post('/api/v1/accounts/signin')
        .send({
          username: 'Sergio11',
          password: '123456'
        })
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.code).to.equal(codes.LOGIN_FAIL);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('Username or password invalid.');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should authenticate the user', (done) => {
      request(app)
        .post('/api/v1/accounts/signin')
        .send({
          username: 'Sergio11',
          password: 'sergio11Bisite'
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.LOGIN_SUCCESS);
          expect(res.body.status).to.equal('success');
          const token = sign(user._id, secret);
          expect(res.body.data).to.equal(token);
          user.auth = token;
          done();
        }).catch(err => {
          console.error('ERROR : ', err);
        });
    });
  });

  describe('# POST /api/v1/accounts/signin/facebook', () => {
    it('should authenticate the user with facebook', (done) => {
      request(app)
        .post('/api/v1/accounts/signin/facebook')
        .send({
          id: fbID,
          token: fbToken
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.LOGIN_SUCCESS_WITH_FACEBOOK);
          expect(res.body.status).to.equal('success');
          expect(res.body.data).to.have.lengthOf(97);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# POST /api/v1/accounts/reset-password', () => {
    it('should not reset password - email is required', (done) => {
      request(app)
        .post('/api/v1/accounts/reset-password')
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.code).to.equal(codes.VALIDATION_ERROR);
          expect(res.body.message)
            .to
            .equal('"email" is required');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should not reset password - no such user exist', (done) => {
      request(app)
        .post('/api/v1/accounts/reset-password')
        .send({
          email: 'emailfalso@usal.es'
        })
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.code).to.equal(codes.NO_SUCH_USER_EXIST);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('No such user exists');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should reset password', (done) => {
      request(app)
        .post('/api/v1/accounts/reset-password')
        .send({
          email: user.email
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.PASSWORD_RESET_REQUEST_MADE);
          expect(res.body.status).to.equal('success');
          expect(res.body.data)
            .to
            .equal('We have sent an email to sss4esob@gmail.com. '
              + 'It contains an activation link for you to click to activate your account.');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should not reset password - The last request not expired yet', (done) => {
      request(app)
        .post('/api/v1/accounts/reset-password')
        .send({
          email: user.email
        })
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.code).to.equal(codes.PASSWORD_ALREDY_REQUEST);
          expect(res.body.status).to.equal('error');
          expect(res.body.message)
            .to
            .equal('The password for this user has already been requested within 24 hours.');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# POST /api/v1/accounts/reset-password/token', () => {
    it('should not reset password', (done) => {
      request(app)
        .post('/api/v1/accounts/reset-password/1234567890sdfghj')
        .send({
          password: 'estoesunaprueba12345'
        })
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.code).to.equal(codes.INVALID_CONFIRMATION_TOKEN);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('Invalid confirmation token');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should reset password', (done) => {
      request(app)
        .post(`/api/v1/accounts/reset-password/${resetPasswordToken}`)
        .send({
          password: 'estoesunaprueba12345'
        })
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.PASSWORD_SUCCESSFULLY_RESET);
          expect(res.body.status).to.equal('success');
          expect(res.body.data).to.equal('Password successfully reset');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# GET /api/v1/users/self', () => {
    it('should get self details', (done) => {
      request(app)
        .get(`/api/v1/users/self`)
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_FOUND);
          expect(res.body.status).to.equal('success');
          expect(res.body.data.id).to.equal(user._id.toString());
          expect(res.body.data.username).to.equal(user.username);
          expect(res.body.data.fullname).to.equal(user.fullname);
          expect(res.body.data.bio).to.equal(user.biography);
          expect(res.body.data.website).to.equal(user.website);
          expect(res.body.data.counts.media).to.equal(0);
          expect(res.body.data.counts.follows).to.equal(0);
          expect(res.body.data.counts.followed_by).to.equal(0);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# GET /api/v1/users/:id', () => {
    it('should get user details', (done) => {
      request(app)
        .get(`/api/v1/users/${anotherUser._id}`)
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_FOUND);
          expect(res.body.status).to.equal('success');
          expect(res.body.data.id).to.equal(anotherUser._id.toString());
          expect(res.body.data.username).to.equal(anotherUser.username);
          expect(res.body.data.fullname).to.equal(anotherUser.fullname);
          expect(res.body.data.bio).to.equal(anotherUser.biography);
          expect(res.body.data.website).to.equal(anotherUser.website);
          expect(res.body.data.counts.media).to.equal(0);
          expect(res.body.data.counts.follows).to.equal(0);
          expect(res.body.data.counts.followed_by).to.equal(0);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should report error with message - Not found, when id is invalid', (done) => {
      request(app)
        .get(`/api/v1/users/dsadas232`)
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_NOT_FOUND);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('User not found');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should report error with message - Not found, when user does not exists', (done) => {
      request(app)
        .get('/api/v1/users/56c787ccc67fc16ccc1a5e92')
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_NOT_FOUND);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('User not found');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should report error with message - Forbidden', (done) => {
      request(app)
        .get('/api/v1/users/56c787ccc67fc16ccc1a5e92')
        .expect(httpStatus.FORBIDDEN)
        .then(res => {
          expect(res.body.code).to.equal(codes.INVALID_TOKEN);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('Invalid token');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# PUT /api/v1/users/:id/follow', () => {
    it(`should not follow the user ${user.fullname} - is the same`, (done) => {
      request(app)
        .put(`/api/v1/users/${user._id}/follow`)
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.BAD_REQUEST)
        .then(res => {
          expect(res.body.code).to.equal(codes.CAN_NOT_FOLLOW);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('You can not follow yourself');
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it(`should follow the user ${anotherUser.fullname}`, (done) => {
      request(app)
        .put(`/api/v1/users/${anotherUser._id}/follow`)
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.FOLLOWING_THE_USER);
          expect(res.body.status).to.equal('success');
          expect(res.body.data.follower).to.equal(user._id.toString());
          expect(res.body.data.followed).to.equal(anotherUser._id.toString());
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should return the users that you follow', (done) => {
      request(app)
        .get('/api/v1/users/self/follows')
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_FOLLOWS);
          expect(res.body.status).to.equal('success');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.lengthOf(1);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it('should return the users that following you', (done) => {
      request(app)
        .get('/api/v1/users/self/followed-by')
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_FOLLOWED_BY);
          expect(res.body.status).to.equal('success');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.lengthOf(0);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it(`should unfollow the user ${anotherUser.fullname}`, (done) => {
      request(app)
        .put(`/api/v1/users/${anotherUser._id}/unfollow`)
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.UNFOLLOWING_THE_USER);
          expect(res.body.status).to.equal('success');
          expect(res.body.data.follower).to.equal(user._id.toString());
          expect(res.body.data.followed).to.equal(anotherUser._id.toString());
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });

    it(`${user.fullname} should not follow any user`, (done) => {
      request(app)
        .get('/api/v1/users/self/follows')
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_FOLLOWS);
          expect(res.body.status).to.equal('success');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.lengthOf(0);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# PUT /api/v1/users/self', () => {
    it('should update user details', (done) => {
      user.username = 'KK';
      request(app)
        .put(`/api/v1/users/self`)
        .set('authorization', `Bearer ${user.auth}`)
        .send(user)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.UPDATE_USER_SUCCESS);
          expect(res.body.status).to.equal('success');
          expect(res.body.data.fullname).to.equal(user.fullname);
          expect(res.body.data.username).to.equal('KK');
          expect(res.body.data.website).to.equal(user.website);
          expect(res.body.data.biography).to.equal(user.biography);
          expect(res.body.data.email).to.equal(user.email);
          expect(res.body.data.mobileNumber).to.equal(user.mobileNumber);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# GET /api/v1/users/', () => {
    it('should get all users', (done) => {
      request(app)
        .get('/api/v1/users')
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_LIST);
          expect(res.body.status).to.equal('success');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.lengthOf(3);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  describe('# DELETE /api/v1/users/self', () => {
    it('should delete user', (done) => {
      request(app)
        .delete(`/api/v1/users/self`)
        .set('authorization', `Bearer ${user.auth}`)
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.body.code).to.equal(codes.USER_DELETED);
          expect(res.body.status).to.equal('success');
          expect(res.body.data.fullname).to.equal(user.fullname);
          expect(res.body.data.username).to.equal('KK');
          expect(res.body.data.website).to.equal(user.website);
          expect(res.body.data.biography).to.equal(user.biography);
          expect(res.body.data.email).to.equal(user.email);
          expect(res.body.data.mobileNumber).to.equal(user.mobileNumber);
          done();
        })
        .catch(err => {
          console.error('ERROR : ', err.response.text);
        });
    });
  });

  after(() => anotherUser.removeAsync());
});
