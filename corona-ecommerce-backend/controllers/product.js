const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate('category') //populate() function in mongoose is used for populating the data inside the reference.
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: 'Product not found',
        });
      }
      req.product = product;
      next();
    });
};
//we have read to get single product
exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      });
    }
    // check for all fields
    const { name, description, price, category, quantity, shipping } = fields;

    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: 'All fields are required',
      });
    }

    let product = new Product(fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      // console.log("FILES PHOTO: ", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size',
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(result);
    });
  });
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({
      message: 'Product deleted successfully',
    });
  });
};

//Working with file uploads, called "Formidable".
exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      });
    }
    // // check for all fields
    // const {
    // name,
    // description,
    // price,
    // category,
    // quantity,
    // shipping
    // } = fields;

    // if (
    // !name ||
    // !description ||
    // !price ||
    // !category ||
    // !quantity ||
    // !shipping
    // ) {
    // return res.status(400).json({
    // error: "All fields are required"
    // });
    // }

    let product = req.product;
    product = _.extend(product, fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      // console.log("FILES PHOTO: ", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size',
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(result);
    });
  });
};

/**
 * This is for home page not for search. for search filter we have listBySearch
 * sell / arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all products are returned
 * we can grab the route query by req.query and 'asc' that will be all product
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : 'asc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  //Here id and 6 are the default value
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  //now pulling all the products from database based on these above queries
  Product.find()
    .select('-photo')
    .populate('category')
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: 'Products not found',
        });
      }
      res.json(products);
    });
};

/**
 * it will find the products based on the req product category
 * other products that has the same category, will be returned.
 * Id is here just to avoid the current product
 *
 * The find operation is the primary operation of retrieving data from a collection.
 */

exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .limit(limit)
    .populate('category', '_id name')
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({
          error: 'Products not found',
        });
      }
      res.json(products);
    });
};
/**
 * This will return all the categories name. Simply name of the all categories used for product. "used for product" this is very important  
 *
 * distinct operation:  The distinct operation is slightly different from the *find operation. The distinct returns an array of all the distinct values of *the field specified. There can be thousands of documents in a collection.  *There can be fields common in all the documents and these fields can have  *similar values. This is where distinct is helpful. Let’s see the syntax of *the distinct operation.
 *db.<collection-name>.distinct(<field-name>)

 * Distinct the categories form the product model. We have total four categories but only two categories are used for product. This is the main point. retrieving all categories used for product.
 */

exports.listCategories = (req, res) => {
  Product.distinct('category', {}, (err, categories) => {
    if (err) {
      return res.status(400).json({
        error: 'Categories not found',
      });
    }
    res.json(categories);
  });
};

/**
 * list products by search for shop page not home page
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */

exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : 'desc';
  let sortBy = req.body.sortBy ? req.body.sortBy : '_id';
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip); // to have load more button
  let findArgs = {}; // we will be sending the argument object. this will contain the category ids and price range. It is empty to begin with

  //console.log(order, sortBy, limit, skip, req.body.filters);
  //console.log('findArgs', findArgs);

  //How we will be able to send search filters in the request body and we will be able to extract the category and price range as well
  //for better understanding of this below code just show the result of the output of postman. the below code only returns total products nothing else.

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === 'price') {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        //otherwise grab the key that will be category
        findArgs[key] = req.body.filters[key];

        //const name  = req.body.name; const email = req.body.email;        const age   = req.body.age. these are used to validate
      }
    }
  }

  //now pulling all the products from database based on the above queries
  //in the previous we have only Product.find() but this time we have Product.find(findArgs). Here is the main difference of pulling data between two find method. This is very important. Product.find() means to get all the products and Product.find(findArgs) means, get product only depending on findArgs. If we don't put any argument in find it will pull all the products

  Product.find(findArgs) //Product.find(findArgs) this is the vital point
    .select('-photo')
    .populate('category')
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: 'Products not found',
        });
      }
      res.json({
        size: data.length,
        data,
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set('Content-Type', req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

//ListSearch is used for the Home page searched filter not shop page

exports.listSearch = (req, res) => {
  // create query object to hold search value and category value
  const query = {};
  // assign search value to query.name
  // i is for Case insensitivity to match upper and lower cases.
  //$regex: Provides regular expression capabilities for pattern matching strings in queries.
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
    // assign category value to query.category
    //we need to check if we getting all.if user does not pick the category we
    //get the default value of all
    if (req.query.category && req.query.category != 'All') {
      query.category = req.query.category;
    }
    // find the product based on query object with 2 properties
    // search and category
    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(products);
    }).select('-photo');
  }
};

exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  Product.bulkWrite(bulkOps, {}, (error, products) => {
    if (error) {
      return res.status(400).json({
        error: 'Could not update product',
      });
    }
    next();
  });
};
