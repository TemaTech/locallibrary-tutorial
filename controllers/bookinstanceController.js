const BookInstance = require("../models/bookinstance");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");
const Author = require('../models/author');
const Genre = require("../models/genre");
// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate('book').exec();

  res.render('bookinstance_list', {
    title: 'Book Instance List',
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});


// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").exec();

  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookinstance = await BookInstance.findById(req.params.id).populate('book').exec();

  if (bookinstance === null) res.redirect('/catalog/bookinstances');

  res.render('bookinstance_delete', {
    title: 'Delete Book Instance',
    bookinstance: bookinstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
  res.redirect('/catalog/bookinstances');
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookinstance, book_list] = await Promise.all([
    BookInstance.findById(req.params.id).populate('book'),
    Book.find({}, 'title')
  ]);

  if (bookinstance === null) {
    // No results
    const err = new Error('Book not found');
    err.status = 404;
    return next(err);
  }

  res.render('bookinstance_form', {
    title: 'Update Book Instance',
    bookinstance: bookinstance,
    book_list: book_list
  });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize form fields
  body('book')
    .trim()
    .escape(),
  body('imprint')
    .trim()
    .escape(),
  body('due_back')
    .trim()
    .escape(),
  body('status')
    .trim()
    .custom(value => {
      if (!['Maintenance', 'Available', 'Loaned', 'Reserved'].includes(value)) {
        throw new Error('Invalid status value.');
      }

      return true;
    })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      _id: req.params.id,
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const book_list = await Book.find({}, 'title');

      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        bookinstance: bookinstance,
        book_list: book_list,
        errors: errors.array(),
      });

      return;
    } else {
      const thebookinstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
      res.redirect(thebookinstance.url);
    }
  })
];
