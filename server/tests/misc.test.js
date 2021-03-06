import request from 'supertest-as-promised';
import httpStatus from 'http-status';
import chai from 'chai';
import { expect } from 'chai';
import app from '../app';
import * as codes from '../codes/';


chai.config.includeStack = true;

describe('## Misc', () => {
  describe('# GET /api/v1/health-check', () => {
    it('should return OK', (done) => {
      request(app)
        .get('/api/v1/health-check')
        .expect(httpStatus.OK)
        .then(res => {
          expect(res.text).to.equal('OK');
          done();
        });
    });
  });

  describe('# GET /api/404', () => {
    it('should return 404 status', (done) => {
      request(app)
        .get('/api/v1/404')
        .query({ lang: 'es' })
        .expect(httpStatus.NOT_FOUND)
        .then(res => {
          expect(res.body.code).to.equal(codes.API_NOT_FOUND);
          expect(res.body.status).to.equal('error');
          expect(res.body.message).to.equal('API no encontrada');
          done();
        });
    });
  });
});
