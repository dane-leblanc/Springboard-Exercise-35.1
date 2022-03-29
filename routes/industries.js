const express = require("express");
const { rows } = require("pg/lib/defaults");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
  try {
    const industryResults = await db.query(
      `SELECT code, name
            FROM industries`
    );

    const companiesResults = await db.query(
      `SELECT i.code AS i_code, c.code AS c_code
        FROM industries i
        JOIN companies_industries ci
        ON i.code = ci.ind_code
        JOIN companies c
        ON ci.comp_code = c.code`
    );

    let industryToCompanyMap = {};

    companiesResults.rows.forEach((record) => {
      if (industryToCompanyMap[record.i_code] == undefined) {
        industryToCompanyMap[record.i_code] = [];
      }
      industryToCompanyMap[record.i_code].push(record.c_code);
    });

    let results = [];

    industryResults.rows.forEach((row) => {
      let industryObj = {
        industryCode: row.code,
        industryName: row.name,
        companies: industryToCompanyMap[row.code],
      };
      results.push(industryObj);
    });

    return res.json({
      industries: results,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name } = req.body;

    const results = await db.query(
      `INSERT INTO industries (code, name)
            VALUES ($1, $2)
            RETURNING code, name`,
      [code, name]
    );
    return res.json({ industry: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
