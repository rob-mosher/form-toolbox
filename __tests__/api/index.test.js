const crypto = require('crypto');
const request = require('supertest');
// const express = require('express');
const app = require('../../src/api/index');

const { ACCEPTED_UPLOAD_MIME_TYPES } = require('../../src/api/constants/acceptedUploadMimeTypes');

describe('API server', () => {
  const invalidRandomURL = `/invalid-random-url-${crypto.randomUUID()}`;

  describe('GET /', () => {
    it('should respond with a 200 status code', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
    })
  });

  describe('GET /healthcheck', () => {
    it('should respond with a 200 status code', async () => {
      const response = await request(app).get('/healthcheck');
      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api', () => {
    it('should respond with a 200 status code', async () => {
      const response = await request(app).get('/api');
      expect(response.statusCode).toBe(200);
    })
  });

  describe('GET /api/upload', () => {
    it('should respond with a 200 status code', async () => {
      const response = await request(app).get('/api/upload');
      expect(response.statusCode).toBe(200);
    })
  });

  describe('POST /api/upload', () => {
    it('should respond with a 500 status code, due to an empty request', async () => {
      const response = await request(app).post('/api/upload');
      expect(response.statusCode).toBe(500);
    })
  });

  describe('GET /api/upload/acceptedMimeTypes', () => {
    it('should match an expected list of supported MIME types', async () => {
      const response = await request(app).get('/api/upload/acceptedMimeTypes');
      const responseStringified = response.text;
      const acceptedStringified = JSON.stringify(ACCEPTED_UPLOAD_MIME_TYPES);
      expect(responseStringified === acceptedStringified).toBe(true);
    })
  });

  describe('GET /api/upload/acceptedMimeTypes', () => {
    it('should not match an invalid list of supported MIME types', async () => {
      const response = await request(app).get('/api/upload/acceptedMimeTypes');
      const responseStringified = response.text;
      const invalidTypes = [...ACCEPTED_UPLOAD_MIME_TYPES, 'invalidEntry'];
      const invalidStringified = JSON.stringify(invalidTypes);
      expect(responseStringified === invalidStringified).toBe(false);
    })
  });

  describe(`GET ${invalidRandomURL}`, () => {
    it('should respond with a 404 status code', async () => {
      const response = await request(app).get(invalidRandomURL);
      expect(response.statusCode).toBe(404);
    })
  });
});
