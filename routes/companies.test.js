process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

beforeEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query(
    `INSERT INTO companies (code, name, description) 
        VALUES ('apple', 'Apple Computer', 'Maker of OSX'), ('ibm', 'IBM', 'Big blu')`
  );
});

afterAll(async () => {
  await db.end();
});

describe("GET /", function () {
  test("get an array of companies", async function () {
    const response = await request(app).get("/companies/");
    expect(response.body).toEqual({
      companies: [
        { code: "apple", name: "Apple Computer" },
        { code: "ibm", name: "IBM" },
      ],
    });
  });
});

describe("GET /:code", function () {
  test("get company info by code", async function () {
    const response = await request(app).get("/companies/apple");
    expect(response.body).toEqual({
      company: {
        code: "apple",
        description: "Maker of OSX",
        name: "Apple Computer",
      },
      invoices: [],
    });
  });
});

describe("POST /", function () {
  test("post new company", async function () {
    const response = await request(app).post("/companies").send({
      code: "dell",
      name: "Dell Computer",
      description: "Dell is a dull name",
    });
    expect(response.body).toEqual({
      company: {
        code: "dell",
        name: "Dell Computer",
        description: "Dell is a dull name",
      },
    });
  });

  test("Should return 500 for conflict", async function () {
    const response = await request(app)
      .post("/companies")
      .send({ code: "apple", name: "Apple Computer", description: "too many" });
    expect(response.status).toEqual(500);
  });
});

describe("PUT /:code", function () {
  test("Update company description", async function () {
    const response = await request(app).put("/companies/apple").send({
      name: "Apple Computer",
      description: "Creator of Snow Leopard",
    });
    expect(response.body).toEqual({
      company: {
        code: "apple",
        name: "Apple Computer",
        description: "Creator of Snow Leopard",
      },
    });
  });
});

describe("DELETE /:code", function () {
  test("Delete apple", async function () {
    const response = await request(app).delete("/companies/apple");
    expect(response.body).toEqual({ status: "deleted" });
  });
});
