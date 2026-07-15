import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

jest.setTimeout(30000);

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/auth/register (POST) should validate payload', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({})
      .expect(400);
  });

  it('/api/v1/health should be not found (no health controller)', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(404);
  });
});
