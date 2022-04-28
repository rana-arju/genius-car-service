const express = require('express');
var jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
const port = process.env.PORT || 5000;

  //middleware
  app.use(cors());
  app.use(express.json());
function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({message: 'unauthorized Access'});
    }else{
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SCREATE, (error, decoded) =>{
            if (error) {
                return res.status(403).send({message: 'Forbiden Access'})
            }
            console.log('decoded', decoded);
            req.decoded = decoded;
        })
    }
    next();
}
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.sptt8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
    await client.connect();
    const serviceCollection = client.db('car-services').collection('service');
    const orderCollection = client.db('geniusCar').collection('order');
    //auth
    app.post('/login', async(req,res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SCREATE, {
            expiresIn: '1d'
        });
        res.send({token})
    })
    //services api
    app.get('/service', async(req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
    });
    app.get('/service/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const service = await serviceCollection.findOne(query);
        res.send(service);
    });
    //post
    app.post('/service', async(req,res) => {
        const newService = req.body;
        const result = await serviceCollection.insertOne(newService);
        res.send(result)
    })
    //Delete
    app.delete('/service/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await serviceCollection.deleteOne(query);
        res.send(result);
    });
    //Order collection
    app.get('/order',verifyJWT, async (req, res) => {
        const decodedEmail =req.decoded.email;
        const email = req.query.email;
        if (email === decodedEmail) {
            const query = {eamil: email};
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        }
        else{
            res.status(403).send({message: 'forbiden access'})
        }
    })
    app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
    }
    finally{

    }
}
run().catch(console.dir);

  app.get('/', (req, res) => {
      res.send('Server Runing....')
  })

  app.listen(port, () => {
      console.log('listening to port...');
  })
