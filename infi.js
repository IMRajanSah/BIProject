let express = require('express');
let mongo = require('mongodb');
let bodyParser = require('body-parser');
let path = require('path');

let PORT = process.env.PORT || 3000;

let urlencodedParser = bodyParser.urlencoded({ extended: false });
let url="mongodb+srv://rajansah:R7QmqmdmA4jyah9@rajan.q8ma6.mongodb.net/todolist?retryWrites=true&w=majority";
let MClient = mongo.MongoClient;
let app = express();


app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/infi.html'));
});

app.post('/add', urlencodedParser, function (req, res) {
  console.log('added');
  let query = {
    task_name: req.body.task_name,
    task_description: req.body.task_description,
    creator: req.body.creator,
    duration: parseInt(req.body.duration),
    created_at: (() => {
      let curr = new Date();
      return curr.getTime();
    })(),
    exp: 0
  };
  
  MClient.connect(url, (err, db) => {
    if(err) throw err;
    db.db('todolist').collection('todo').insertOne(query, (err, resp) => {
      if(err) throw err;
      res.send("<h1>Task Added<h1>");
      db.close();
    })
  })
});

let fetchNonExpiredList = (response) => {
	let query = {
    exp: 0
  };
  
  MClient.connect(url, (err, db) => {
    if(err) throw err;
    db.db('todolist').collection('todo').find(query).toArray((err, resp) => {
      if(err) throw err;
      response.send(JSON.stringify(resp));//list data send
      
      db.close();
    })
  });
};

let setExpiredForId = (doc_id) => {
	MClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var myquery = { _id: doc_id };
	  var newvalues = { $set: {exp: 1} };
	  db.db("todolist").collection("todo").updateOne(myquery, newvalues, function(err, res) {
		if (err) throw err;
		db.close();
	  });
	});
};

let checkForExpired = (response) => {
	let query = {
    exp: 0
  };
	
	MClient.connect(url, (err, db) => {
    if(err) throw err;
    db.db('todolist').collection('todo').find(query).toArray((err, resp) => {
      if(err) throw err;
        
    for(x in resp){
      let tuple = resp[x];
      let expDate = new Date(tuple['created_at']+tuple.duration*60000);
      let currDate = new Date();
      if(currDate.getTime() > expDate.getTime()){
        setExpiredForId(tuple['_id']);
      }  
    }
    fetchNonExpiredList(response);
    db.close();
    })
  });
};



app.get('/list', function (req, res) {
  console.log('list');
  
	checkForExpired(res);
	
});

let server = app.listen(PORT, () => {
  console.log("Online")
});