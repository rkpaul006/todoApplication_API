const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
  };
};

const ifPriorityAndStatusGiven = (requestQuery) => {
  return requestQuery.priority != undefined && requestQuery.status != undefined;
};

const ifPriorityGiven = (requestQuery) => {
  return requestQuery.priority != undefined;
};

const ifStatusGiven = (requestQuery) => {
  return requestQuery.status != undefined;
};

//API-1//
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case ifPriorityAndStatusGiven(request.query):
      getTodoQuery = `SELECT * FROM todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND status = '${status}';`;
      break;
    case ifPriorityGiven(request.query):
      getTodoQuery = `
        SELECT * FROM todo
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
      break;
    case ifStatusGiven(request.query):
      getTodoQuery = `
        SELECT * FROM todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
            SELECT * FROM todo
            WHERE 
              todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});
//API-5//
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo
   WHERE id = ${todoId};`;
  const result = await db.get(deleteTodo);
  response.send("Todo Deleted");
});
//API-2//
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getStates = `SELECT * FROM todo WHERE id = ${todoId};`;
  const states = await db.get(getStates);
  response.send(convertObj(states));
});
//API-3//
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const insertTodo = `
    INSERT INTO
        todo (id, todo, priority, status)
    VALUES
        (
        "${id}",
        "${todo}",
        "${priority}",
        "${status}"
        );`;
  const todoAddition = await db.run(insertTodo);
  response.send("Todo Successfully Added");
});
//api-4//
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateItem = "";
  const requestItem = request.body;
  switch (true) {
    case requestItem.todo != undefined:
      updateItem = "Todo";
      break;
    case requestItem.priority != undefined:
      updateItem = "Priority";
      break;
    case requestItem.status != undefined:
      updateItem = "Status";
      break;
  }
  const previousTodo = `
  SELECT 
    *
  FROM
    todo
  WHERE
    id = ${todoId};`;
  const preTodo = await db.get(previousTodo);
  const {
    todo = preTodo.todo,
    priority = preTodo.priority,
    status = preTodo.status,
  } = request.body;
  const updateDetails = `
    UPDATE todo SET
    todo = "${todo}",
    priority = "${priority}",
    status = "${status}"
    WHERE
     id = ${todoId};`;
  const updateDistrict = await db.run(updateDetails);
  response.send(`${updateItem} Updated`);
});
module.exports = app;
