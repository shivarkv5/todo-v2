//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { compile } = require("ejs");
const schema = mongoose.Schema
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//1st Step:  Create new database inside mongodb
// URL = place where mongodb hosted locally.
mongoose.connect("mongodb://localhost:27017/todoListDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

// Schema 
const ItemSchema = mongoose.Schema({ name: String });

// Mongoose model
const item = mongoose.model('item', ItemSchema);

const it1 = new item({ name: "Welcome to todo list" })
const it2 = new item({ name: "create a new todo" })
const it3 = new item({ name: "Hit the checkbox to delete the item " })

const defaultArray = [it1, it2, it3]

// This schema is for the structure of custom routes.
const newListSchema = {
  newListName: String, // Name of list like each route has its own name and its a single name
  newListItems: [ItemSchema] // Array of items of type ItemSchema.
}
// MOngoose model
const newListItem = mongoose.model("newListItem", newListSchema)


// const items = [];
// const workItems = [];
app.get("/", function (req, res) {
  const day = date.getDate();

  item.find({}, (err, foundItems) => {
    console.log(foundItems)
    if (err) throw err;
    else if (foundItems.length == 0) {
      item.insertMany(defaultArray, (err) => {
        if (err) throw err;
        else console.log("Successfully inserted default items")
      })
      res.redirect("/")
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  })
});

app.post("/", function (req, res) {

  const day = date.getDate();

  const typedItem = req.body.newItem;
  const typedList = req.body.list;

  const passingItem = new item({ name: typedItem })

  if (typedList === day) {
    // If its home route
    passingItem.save()
    res.redirect("/");
  } else {
    //If its custom route search for the custom list and and the item name to that list.
    newListItem.findOne({ newListName: typedList }, (err, foundData) => {
      const foundListName = foundData.newListName;
      foundData.newListItems.push(passingItem);
      foundData.save();
      res.redirect("/" + typedList)
    })
  }
});

app.post("/delete", (req, res) => {
  const checkedId = req.body.chk;
  const checkedListName = req.body.listName;

  if (checkedListName == date.getDate()) {
    item.findByIdAndRemove(`${checkedId}`, function (err) {
      if (err) console.log(err);
      console.log("Successful deletion");
    });
    res.redirect("/")
  } else {
    //1. Find the list name and go that 
    //2. get that item using _id, Using pull method remove that document from array of items and update the array.
    newListItem.findOneAndUpdate({ newListName: checkedListName }, { $pull: { newListItems: { _id: checkedId } } }, (err, foundData) => {
      if (!err) {
        res.redirect("/" + checkedListName)
      }
    })

  }



})

app.get('/:todoType', (req, res) => {
  // res.send('The id you specified is ' + req.params.id);
  const routeParam = req.params.todoType

  //Finds a list that already created with route param
  newListItem.findOne({ newListName: routeParam }, function (err, data) {
    // console.log(data)
    // // If the list with same name is created.
    // if (data = null) {
    //   // creates a new list if its does not exists
    //   console.log(" This list is already defined ==>" + data.newListName);
    //   //Creating a new custom list
    //   const newList = new newListItem({
    //     newListName: routeParam, //Name of the list which is when user types a param route
    //     newListItems: defaultArray
    //   });
    //   newList.save();
    // }
    // else {
    //   //displays a created list
    //   res.render("list", { listTitle: routeParam, newListItems: data.newListItems })
    // }

    if (!data) {
      //Create a new List
      const newList = new newListItem({
        newListName: routeParam, //Name of the list which is when user types a param route
        newListItems: defaultArray
      });
      newList.save();
      console.log(data)
      res.redirect("/" + routeParam) // Since we are creating a new list, we need to render it to new page, INorder to do so we have redirest to same page and then the same list cannot be empty and will go to else part and renders the list.

    } else {
      //Display existing list
      res.render("list", { listTitle: routeParam, newListItems: data.newListItems })
    }



  });






});


app.get("/about", function (req, res) {
  res.render("about", { listTitle: "Hello there" });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
