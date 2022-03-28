process.emitWarning.NODE_ENV = "test";

const { Test } = require("supertest");
const request = require("supertest");

const app = require("../app");
const db = require("../db");

beforeEach(async () => {
  await db.query("DELETE FROM companies");
  await db.query(`DELETE FROM invoices`);
  await db.query("SELECT setval('invoices_id_seq', 1, false)");
  await db.query(
    `INSERT INTO companies (code, name, description) 
          VALUES ('apple', 'Apple Computer', 'Maker of OSX'), ('ibm', 'IBM', 'Big blu')`
  );
  await db.query(
    `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
        VALUES ('apple', 200, true, '2020-01-02', '2020-01-03'),
            ('ibm', 500, false, '2020-03-16', null)`
  );
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", function () {
  test("Get an array of invoices", async function () {
    const response = await request(app).get("/invoices");
    expect(response.body).toEqual({
      invoices: [
        { id: 1, comp_code: "apple" },
        { id: 2, comp_code: "ibm" },
      ],
    });
  });
});
