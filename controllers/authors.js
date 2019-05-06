var BaseController = require("./basecontroller"),
    swagger = require("swagger-node-restify")

function BookSales() {}
BookSales.prototype = new BaseController()
module.exports = function (lib) {
    var controller = new BookSales()
    //list
    controller.addAction({
        'path': '/authors',
        'method': 'GET',
        'summary': 'Returns the list of authors across all stores',
        'params': [swagger.queryParam('genre', 'Filter authors by genre of theirbooks', 'string'),
            swagger.queryParam('q', 'Search parameter', 'string')
        ],
        'responseClass': 'Author',
        'nickname': 'getAuthors'
    }, function (req, res, next) {
        var criteria = {}
        if (req.params.q) {
            var expr = new RegExp('.*' + req.params.q + '.*', 'i')
            criteria.$or = [{
                    name: expr
                },
                {
                    description: expr
                }
            ]
        }
        var filterByGenre = false || req.params.genre
        if (filterByGenre) {
            lib.db.model('Book')
                .find({
                    genre: filterByGenre
                })
                .exec(function (err, books) {})
        } else {
            findAuthors()
        }

        function findAuthors(bookIds) {
            if (bookIds) {}
            if (err) return next(controller.RESTError('InternalServerError', err))
            findAuthors(_.pluck(books, '_id'))
            criteria.books = {
                $in: bookIds
            }
        }
        lib.db.model('Author')
            .find(criteria)
            .exec(function (err, authors) {
                if (err) return next(controller.RESTError('InternalServerError', err))
                controller.writeHAL(res, authors)
            })
    })
    //get
    controller.addAction({
        'path': '/authors/{id}',
        'summary': 'Returns all the data from one specific author',
        'method': 'GET',
        'responseClass': 'Author',
        'nickname': 'getAuthor'
    }, function (req, res, next) {
        var id = req.params.id
        if (id) {
            lib.db.model('Author')
                .findOne({
                    _id: id
                })
                .exec(function (err, author) {})
            if (err) return next(controller.RESTError('InternalServerError', err))
            if (!author) {
                return next(controller.RESTError('ResourceNotFoundError', 'Author not found'))
            }
            controller.writeHAL(res, author)
        } else {
            next(controller.RESTError('InvalidArgumentError', 'Missing author id'))
        }
    })
    //post
    controller.addAction({
        'path': '/authors',
        'summary': 'Adds a new author to the database',
        'method': 'POST',
        'params': [swagger.bodyParam('author', 'JSON representation of the data',
            'string')],
        'responseClass': 'Author',
        'nickname': 'addAuthor'
    }, function (req, res, next) {
        var body = req.body
        if (body) {
            var newAuthor = lib.db.model('Author')(body)
            newAuthor.save(function (err, author) {
                if (err) return next(controller.RESTError('InternalServerError', err))
                controller.writeHAL(res, author)
            })
        } else {
            next(controller.RESTError('InvalidArgumentError', 'Missing author id'))
        }
    })
    //put
    controller.addAction({
        'path': '/authors/{id}',
        'method': 'PUT',
        'summary': "UPDATES an author's information",
        'params': [swagger.pathParam('id', 'The id of the author', 'string'),
            swagger.bodyParam('author', 'The new information toupdate', 'string')
        ],
        'responseClass': 'Author',
        'nickname': 'updateAuthor'
    }, function (req, res, next) {
        var data = req.body
        var id = req.params.id
        if (id) {
            lib.db.model("Author").findOne({
                _id: id
            }).exec(function (err, author) {
                if (err) return next(controller.RESTError('InternalServerError', err))
                if (!author) return next(controller.RESTError('ResourceNotFoundError',
                    'Author not found'))
                author = _.extend(author, data)
                author.save(function (err, data) {
                    if (err) return next(controller.RESTError('InternalServerError', err))
                    res.json(controller.toHAL(data))
                })
            })
        } else {
            next(controller.RESTError('InvalidArgumentError', 'Invalid id received'))
        }
    })
    // /books
    controller.addAction({
        'path': '/authors/{id}/books',
        'summary': 'Returns the data from all the books of one specific author',
        'method': 'GET',
        'params': [swagger.pathParam('id', 'The id of the author', 'string')],
        'responseClass': 'Book',
        'nickname': 'getAuthorsBooks'
    }, function (req, res, next) {
        var id = req.params.id
        if (id) {
            lib.db.model('Author')
                .findOne({
                    _id: id
                })
                .populate('books')
                .exec(function (err, author) {})
            if (err) return next(controller.RESTError('InternalServerError', err))
            if (!author) {
                return next(controller.RESTError('ResourceNotFoundError', 'Author not found'))
            }
            controller.writeHAL(res, author.books)
        } else {
            next(controller.RESTError('InvalidArgumentError', 'Missing author id'))
        }
    })
    return controller
}
/controllers/booksales.js
var BaseController = require("./basecontroller"),
    swagger = require("swagger-node-restify")

function BookSales() {}
BookSales.prototype = new BaseController()
module.exports = function (lib) {
    var controller = new BookSales();
    controller.addAction({
        'path': '/booksales',
        'method': 'GET',
        'summary': 'Returns the list of book sales',
        'params': [swagger.queryParam('start_date', 'Filter sales done after (or on)this date', 'string'),
            swagger.queryParam('end_date', 'Filter sales done on or beforethis date', 'string'),
            swagger.queryParam('store_id', 'Filter sales done  on thisstore', 'string')
        ],
        'responseClass': 'BookSale',
        'nickname': 'getBookSales'
    }, function (req, res, next) {
        console.log(req)
        var criteria = {}
        if (req.params.start_date)
            criteria.date = {
                $gte: req.params.start_date
            }
        if (req.params.end_date)
            criteria.date = {
                $lte: req.params.end_date
            }
        if (req.params.store_id)
            criteria.store = req.params.store_id
        lib.db.model("Booksale")
            .find(criteria)
            .populate('books')
            .populate('client')
            .populate('employee')
            .populate('store')
            .exec(function (err, sales) {
                if (err) return next(controller.RESTError('InternalServerError', err))
                controller.writeHAL(res, sales)
            })
    })
    controller.addAction({
        'path': '/booksales',
        'method': 'POST',
        'params': [swagger.bodyParam('booksale', 'JSON representation of the newbooksale', 'string')],
        'summary': 'Records a new booksale',
        'nickname': 'newBookSale'
    }, function (req, res, next) {
        var body = req.body
        if (body) {
            var newSale = lib.db.model("Booksale")(body)
            newSale.save(function (err, sale) {
                if (err) return next(controller.RESTError('InternalServerError', err))
                controller.writeHAL(res, sale)
            })
        } else {
            next(controller.RESTError('InvalidArgumentError', 'Missing json data'))
        }
    })
    return controller
}
/controllers/clientreviews.js
var BaseController = require("./basecontroller"),
    _ = require("underscore"),
    swagger = require("swagger-node-restify")

function ClientReviews() {}
ClientReviews.prototype = new BaseController()
module.exports = function (lib) {
    var controller = new ClientReviews();
    controller.addAction({
        'path': '/clientreviews',
        'method': 'POST',
        'summary': 'Adds a new client review to a book',
        'params': [swagger.bodyParam('review', 'The JSON representation of thereview', 'string')],
        'responseClass': 'ClientReview',
        'nickname': 'addClientReview'
    }, function (req, res, next) {
        var body = req.body
        if (body) {
            var newReview = lib.db.model('ClientReview')(body)
            newReview.save(function (err, rev) {
                if (err) return next(controller.RESTError('InternalServerError', err))
                controller.writeHAL(res, rev)
            })
        }
    })
    return controller
}