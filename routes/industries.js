const express = require("express");
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
        `SELECT c.code
        FROM industries i
        JOIN companies_industries ci
        ON i.code = ci.ind_code
        JOIN companies c
        ON ci.comp_code = c.code`
    )
    return res.json({ industries: industryResults.rows,
    companies: companiesResults.rows});
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
