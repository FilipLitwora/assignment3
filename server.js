//Database setup:
// First: Our code will open a sqlite database file for you, and create one if it not exists already.
// It will be automatically re-created and filled with one example item.

const sqlite = require("sqlite3").verbose();
let db = my_database("./gallery.db");

// ###############################################################################
// The database should be OK by now. Let's setup the Web server so we can start
// defining routes.
//
// First, create an express application `app`:

var express = require("express");
var app = express();

// Middleware to parse JSON data in the body of our HTTP requests:
app.use(express.json());

// ###############################################################################
// Routes
// ###############################################################################

// This route responds to POST http://localhost:3000/ by
// inserting the data from the request to the database
app.post("/", function (req, res) {
  const body = req.body;

  const params = ["author", "alt", "tags", "image", "description"];
  const arr = [];
  const errors = [];

  for (const param of params) {
    if (!body[param]) {
      errors.push(param);
    } else {
      arr.push(body[param]);
    }
  }

  if (errors.length) {
    res.status(400); // error 400 indicating client error
    return res.json({
      error: "Error! " + errors.join(", ") + " must be not empty",
    });
  }

  db.run(
    "INSERT INTO gallery (author, alt, tags, image, description) VALUES (?, ?, ?, ?, ?)",
    arr,
    function (_, err) {
      if (err) {
        res.status(500); // error 500 indicating server error
        return res.json({ error: "Error!: " + err });
      }

      return res.sendStatus(201); // status 201 Created
    }
  );
});

// This route responds to GET http://localhost:3000/ by selecting
// all data from the database and return it as JSON object.
app.get("/", function (_, res) {
  db.all(`SELECT * FROM gallery`, function (err, rows) {
    if (err) {
      res.status(500);
      return res.json({ error: "Error! " + err });
    }

    res.status(200);
    // # Return db response as JSON
    return res.json(rows);
  });
});

// This route responds to PATCH http://localhost:3000/ by updating
// the data in the database with the data from the request.
app.patch("/", function (req, res) {
  const body = req.body;
  const id = body.id;

  if (!id) {
    res.status(400); // error 400 indicating client error
    return res.json({ error: "Error! id must not be empty" });
  }

  const params = ["author", "alt", "tags", "image", "description"];
  let sql = `UPDATE gallery SET`;
  for (const param of params) {
    const value = body[param];
    if (value) {
      sql += ` ${param} = '${value}',`;
    }
  }
  sql = sql.slice(0, -1); // remove last comma
  sql += ` WHERE id = ${id}`;

  db.run(sql, function (err, rows) {
    if (err) {
      res.status(500);
      return res.json({ error: "Error: " + err });
    }

    res.status(200);
    // # Return db response as JSON
    return res.json(rows);
  });
});

// ###############################################################################
// This should start the server, after the routes have been defined, at port 3000:
app.listen(3000);
console.log("Your Web server should be up and running");
console.log("Open http://localhost:3000/ in your browser to see if it works");

// ###############################################################################
// Some helper functions called above
function my_database(filename) {
  // Conncect to db by opening filename, create filename if it does not exist:
  var db = new sqlite.Database(filename, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the gallery database.");
  });
  // Create our gallery table if it does not exist already:
  db.serialize(() => {
    db.run(`
        	CREATE TABLE IF NOT EXISTS gallery
        	 (
                    id INTEGER PRIMARY KEY,
                    author CHAR(100) NOT NULL,
                    alt CHAR(100) NOT NULL,
                    tags CHAR(256) NOT NULL,
                    image char(2048) NOT NULL,
                    description CHAR(1024) NOT NULL
		 )
		`);
    db.all(`select count(*) as count from gallery`, function (_, result) {
      if (result[0].count == 0) {
        db.run(
          `INSERT INTO gallery (author, alt, tags, image, description) VALUES (?, ?, ?, ?, ?)`,
          [
            "Tim Berners-Lee",
            "Image of Berners-Lee",
            "html,http,url,cern,mit",
            "https://upload.wikimedia.org/wikipedia/commons/9/9d/Sir_Tim_Berners-Lee.jpg",
            "The internet and the Web aren't the same thing.",
          ]
        );
        db.run(
          `INSERT INTO gallery (author, alt, tags, image, description) VALUES (?, ?, ?, ?, ?)`,
          [
            "Grace Hopper",
            "Image of Grace Hopper at the UNIVAC I console",
            "programming,linking,navy",
            "https://upload.wikimedia.org/wikipedia/commons/3/37/Grace_Hopper_and_UNIVAC.jpg",
            "Grace was very curious as a child; this was a lifelong trait. At the age of seven, she decided to determine how an alarm clock worked and dismantled seven alarm clocks before her mother realized what she was doing (she was then limited to one clock).",
          ]
        );
        console.log("Inserted dummy photo entry into empty database");
      } else {
        console.log(
          "Database already contains",
          result[0].count,
          " item(s) at startup."
        );
      }
    });
  });
  return db;
}
