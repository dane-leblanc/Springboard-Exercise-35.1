const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT code, name FROM companies");
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async (req, res, next) => {
  const { code } = req.params;
  try {
    const compResults = await db.query(
      "SELECT code, name, description FROM companies WHERE code=$1",
      [code]
    );
    const invResults = await db.query(
      "SELECT id, amt, add_date, paid_date FROM invoices WHERE comp_code=$1",
      [code]
    );
    const industryResults = await db.query(
      `SELECT i.name
      FROM companies c
      JOIN companies_industries ci
      ON c.code = ci.comp_code
      JOIN industries i
      ON ci.ind_code = i.code
      WHERE c.code=$1`,
      [code]
    );
    if (compResults.rows.length === 0) {
      throw new ExpressError(`${code} could not be found.`, 404);
    }
    return res.json({
      company: compResults.rows[0],
      invoices: invResults.rows,
      industries: industryResults.rows,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const code = slugify(name);

    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.json({ company: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", async (req, res, next) => {
  const { code } = req.params;
  try {
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET name=$2, description=$3 WHERE code=$1 RETURNING code, name, description",
      [code, name, description]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`${code} cannot be found`, 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch("/:companyCode", async (req, res, next) => {
  const { companyCode } = req.params;
  try {
    const { industryCode } = req.body;
    const results = await db.query(
      `INSERT INTO companies_industries (comp_code, ind_code)
        VALUES ($1, $2)`,
      [companyCode, industryCode]
    );
    return res.json({ message: `${industryCode} added to ${companyCode}` });
  } catch (err) {
    next(err);
  }
});

router.delete("/:code", async (req, res, next) => {
  const { code } = req.params;
  try {
    const results = await db.query(
      "DELETE FROM companies WHERE code=$1 RETURNING code",
      [code]
    );
    let data = results.rows[0];
    if (!data) {
      throw new ExpressError("Company code not found", 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
