const mongoose = require('mongoose');
const { DateTime, toFormat } = require('luxon');

const Shema = mongoose.Schema;

const AuthorSchema = new Shema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function() {
  // To avoid errors in case where an author does not have either a fimaly name of first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}}`;
  }

  return fullname;
})

// Virtual for author's URL
AuthorSchema.virtual("url").get(function() {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual('date_of_birth_formatted').get(function() {
  return this.date_of_birth ?
    DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : 
    '';
});

AuthorSchema.virtual('date_of_death_formatted').get(function() {
  return this.date_of_death ?
    DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : 
    'present';
});

AuthorSchema.virtual('lifespan').get(function() {
  return `${this.date_of_birth_formatted} - ${this.date_of_death_formatted}`;
});

AuthorSchema.virtual('date_of_birth_datepicker').get(function() {
  return this.date_of_birth ?
    DateTime.fromJSDate(this.date_of_birth).toFormat('yyyy-MM-dd')
    : 
    null;
});

AuthorSchema.virtual('date_of_death_datepicker').get(function() {
  return this.date_of_death ?
    DateTime.fromJSDate(this.date_of_death).toFormat('yyyy-MM-dd')
    : 
    null;
});

// Export model
module.exports = mongoose.model("Author", AuthorSchema);
