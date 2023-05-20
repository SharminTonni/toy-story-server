const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.78xjoll.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const toysCollection = client.db("toyStory").collection("toys");

    const indexKeys = { title: 1 };
    const indexOptions = { name: "title" };

    const result = await toysCollection.createIndex(indexKeys, indexOptions);

    app.get("/toysByTitle/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await toysCollection
        .find({
          $or: [
            { title: { $regex: searchText, $options: "i" } },
            // { category: { $regex: searchText, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    app.get("/mytoys/:category", async (req, res) => {
      const category = req.params.category;
      if (category == "police" || category == "truck" || category == "luxury") {
        const result = await toysCollection
          .find({ category: category })
          .toArray();
        return res.send(result);
      }

      const result = await toysCollection.find().limit(20).toArray();
      res.send(result);
      //   console.log(category);
    });

    // all toys api'

    app.get("/mytoys", async (req, res) => {
      const result = await toysCollection.find().limit(20).toArray();
      res.send(result);
    });

    app.get("/all/:text", async (req, res) => {
      console.log(req.query.email);
      const searchText = req.params.text;

      if (searchText === "ascending") {
        const options = {
          sort: { price: 1 },
        };
        const toys = await toysCollection
          .find({ sellerEmail: req.query.email }, options)
          .toArray();
        const sortedToys = toys.sort((a, b) => {
          const priceA = a.price;
          const priceB = b.price;
          return priceA - priceB;
        });
        return res.send(sortedToys);
      } else if (searchText === "descending") {
        const options = {
          sort: { price: -1 },
        };
        const toys = await toysCollection
          .find({ sellerEmail: req.query.email }, options)
          .toArray();
        const sortedToys = toys.sort((a, b) => {
          const priceA = a.price;
          const priceB = b.price;
          return priceB - priceA;
        });
        return res.send(sortedToys);
      } else {
        const result = await toysCollection
          .find({ sellerEmail: req.query.email })
          .toArray();
        return res.send(result);
      }
    });

    // get details about single toys

    app.get("/:id", async (req, res) => {
      const id = req.params.id;
      //   console.log(id);
      const query = { _id: new ObjectId(id) };

      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    app.post("/toys", async (req, res) => {
      const toy = req.body;
      toy.price = parseFloat(toy.price);
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    });

    app.patch("/update/:id", async (req, res) => {
      const id = req.params.id;
      const toy = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedToy = {
        $set: {
          quantity: toy.quantity,
          price: toy.price,
          description: toy.description,
        },
      };

      const result = await toysCollection.updateOne(filter, updatedToy);
      res.send(result);
    });

    app.delete("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("toy story server is running");
});

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
