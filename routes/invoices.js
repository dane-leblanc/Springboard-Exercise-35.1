const express = require("express");
const { response } = require("../app");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT id, comp_code FROM invoices");
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const results = await db.query(
      "SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id=$1",
      [id]
    );
    const data = results.rows[0];
    if (!data) {
      throw new ExpressError(`Invoice id of ${id} could not be found`, 404);
    }
    return res.json({
      invoice: {
        id: data.id,
        comp_code: data.comp_code,
        amt: data.amt,
        add_date: data.add_date,
        paid_date: data.paid_date,
        company: {
          code: data.code,
          name: data.name,
          description: data.description,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;

    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date",
      [comp_code, amt]
    );
    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { amt, paid } = req.body;
    let paidDate = null;
    const currResult = await db.query(
      `SELECT paid
        FROM invoices
        WHERE id = $1`,
      [id]
    );

    const currPaidDate = currResult.rows[0].paid_data;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }

    const results = await db.query(
      `UPDATE invoices 
        SET amt=$2, paid=$3, paid_date=$4
        WHERE id=$1 
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [id, amt, paid, paidDate]
    );
    let data = results.rows[0];
    if (!data) {
      throw new ExpressError(
        `An invoice with an id of ${id} could not be found`,
        404
      );
    }
    return res.json({ invoice: data });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const results = await db.query("DELETE FROM invoices WHERE id=$1", [id]);
    let data = results.rows[0];
    if (!data) {
      throw new ExpressError("ID not found", 404);
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
