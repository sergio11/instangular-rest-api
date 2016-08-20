import request from 'supertest-as-promised';
import User from '../models/user';
import httpStatus from 'http-status';
import chai from 'chai';
import { expect } from 'chai';
import app from '../app';
import * as codes from '../codes/';

chai.config.includeStack = true;

const token = 'eyJhbGciOiJIUzI1NiJ9.U2VyZ2lvMTE.X8xCcmI0yqAGxIULFgSZv1_2JsxHR-Y9Ka5qzY1HJMU';
const anotherToken = 'eyJhbGciOiJIUzI1NiJ9.bWFyY29z.WteCILBidoG7nF-ETMX1IJEVDX_TisASHanbb5Ra_K8';
const media = {
  type: 'image',
  caption: 'Imagen de prueba',
  link: 'https://www.mediastorage.com/fhjakhfjah4324234jhjkfsdf',
  location: [0, 0]
};

describe('## Media API', () => {
  const user = new User({
    fullname: 'Sergio Sánchez Sánchez',
    username: 'Sergio11',
    password: 'sergio11Bisite',
    biography: 'Sergio es DIOS',
    email: 'sss4esob@gmail.com',
    mobileNumber: '673445695'
  });

  before(() => user.saveAsync().then(savedUser => {
    media.user = savedUser._id;
    return savedUser;
  }));

  it('should report error with message - Forbidden', (done) => {
    request(app)
      .get('/api/media')
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

  it('should not create media - type must be one of [IMAGE, VIDEO]', (done) => {
    request(app)
      .post('/api/media')
      .set('authorization', `Bearer ${token}`)
      .send(media)
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        expect(res.body.code).to.equal(codes.VALIDATION_ERROR);
        expect(res.body.status).to.equal('error');
        expect(res.body.message).to.equal('\"type\" must be one of [IMAGE, VIDEO]');
        media.type = 'IMAGE';
        done();
      })
      .catch(err => {
        console.error('ERROR : ', err.response.text);
      });
  });

  it(`should create a media for ${user.fullname}`, (done) => {
    request(app)
      .post('/api/media')
      .set('authorization', `Bearer ${token}`)
      .send(media)
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.code).to.equal(codes.CREATE_MEDIA_SUCCESS);
        expect(res.body.status).to.equal('success');
        expect(res.body.data.caption).to.equal(media.caption);
        expect(res.body.data.type).to.equal(media.type);
        expect(res.body.data.link).to.equal(media.link);
        media._id = res.body.data._id;
        done();
      })
      .catch(err => {
        console.error('ERROR : ', err.response.text);
      });
  });

  it('should get details of media', (done) => {
    request(app)
      .get(`/api/media/${media._id}`)
      .set('authorization', `Bearer ${token}`)
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.code).to.equal(codes.MEDIA_FOUND);
        expect(res.body.status).to.equal('success');
        expect(res.body.data.caption).to.equal(media.caption);
        expect(res.body.data.type).to.equal(media.type);
        expect(res.body.data.link).to.equal(media.link);
        expect(res.body.data._user.fullname).to.equal(user.fullname);
        expect(res.body.data._user.username).to.equal(user.username);
        done();
      })
      .catch(err => {
        console.error('ERROR : ', err.response.text);
      });
  });

  it('should not delete media - Access Denied', (done) => {
    request(app)
      .delete(`/api/media/${media._id}`)
      .set('authorization', `Bearer ${anotherToken}`)
      .expect(httpStatus.FORBIDDEN)
      .then(res => {
        expect(res.body.code).to.equal(codes.ACCESS_DENIED);
        expect(res.body.status).to.equal('error');
        expect(res.body.message)
          .to
          .equal('Access Denied - You don\'t have permission to: delete media');
        done();
      })
      .catch(err => {
        console.error('ERROR : ', err.response.text);
      });
  });

  it('should delete media', (done) => {
    request(app)
      .delete(`/api/media/${media._id}`)
      .set('authorization', `Bearer ${token}`)
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.code).to.equal(codes.MEDIA_DELETED);
        expect(res.body.status).to.equal('success');
        expect(res.body.data.caption).to.equal(media.caption);
        expect(res.body.data.type).to.equal(media.type);
        expect(res.body.data.link).to.equal(media.link);
        expect(res.body.data._user.fullname).to.equal(user.fullname);
        expect(res.body.data._user.username).to.equal(user.username);
        done();
      })
      .catch(err => {
        console.error('ERROR : ', err.response.text);
      });
  });

  after(() => user.removeAsync());
});