import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import { db } from "../database/database.connection.js";

dayjs.extend(advancedFormat);
// dayjs(birthday).format("x");

async function getRentals(req, res) {
  try {
    const rentals = await db.query("SELECT * FROM rentals");

    rentals.rows.forEach(
      (rental) =>
        (rental.rentDate = dayjs(rental.rentDate).format("YYYY-MM-DD"))
    );

    res.send(rentals.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function postRentals(req, res) {
  const { customerId, gameId, daysRented } = req.body;

  try {
    const consumer = await db.query(`SELECT * FROM customers WHERE id= $1`, [
      customerId,
    ]);
    if (consumer.rows.length === 0) return res.sendStatus(404);

    const game = await db.query(`SELECT * FROM games WHERE id= $1`, [gameId]);
    if (game.rows.length === 0) return res.sendStatus(404);

    const rented = await db.query(
      `SELECT COUNT(*) FROM rentals WHERE "gameId"= $1 AND "returnDate" IS NULL;`,
      [gameId]
    );
    console.log(rented, game.rows[0].stockTotal);
    if (Number(rented.rows[0].count) >= Number(game.rows[0].stockTotal))
      return res.status(400).send("There is no stock available");

    await db.query(
      `INSERT INTO rentals (
      "customerId",
      "gameId",
      "rentDate",
      "daysRented",
      "returnDate",
      "originalPrice",
      "delayFee"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        customerId,
        gameId,
        dayjs().format("YYYY-MM-DD"),
        daysRented,
        null,
        daysRented * game.rows[0].pricePerDay,
        null,
      ]
    );
    res.sendStatus(201);
  } catch (err) {
    res.status(500).send(err.message);
  }
}
async function endRentals(req, res) {}
async function deleteRentals(req, res) {}

export { getRentals, postRentals, endRentals, deleteRentals };
