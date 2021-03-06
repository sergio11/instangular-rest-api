import mongoose from 'mongoose';
import Comment from './comment';
import User from './user';

const MediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['IMAGE', 'VIDEO'],
    default: 'IMAGE'
  },
  caption: {
    type: String,
    required: false
  },
  link: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: [Number],
    index: '2dsphere',
    default: [0, 0]
  },
  _user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

MediaSchema.pre('remove', function (next) {
  Comment.remove({ _media: this._id }).exec();
  next();
});

MediaSchema.post('save', media => {
  console.log('%s has been saved', media._id);
  User.update({ _id: media._user }, { $push: { _media: media._id } }).exec();
});

/**
 * Statics
 */
MediaSchema.statics = {
  /**
   * Get Media
   * @param {ObjectId} id - The objectId of media.
   * @returns {Promise<Media, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate('_user', '_id fullname username')
      .execAsync()
      .then(media => {
        if (!media) {
          return Promise.reject(new Error('No such media exists!'));
        }
        return media;
      });
  },
  /**
   * Search Medias on Give area
   * @param {float} lat - Latitude.
   * @param {float} lon - Longitude.
   * @returns {Promise<Media, APIError>}
   */
  search(lat, lon) {
    return this.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lon, lat] },
          $minDistance: 1000,
          $maxDistance: 5000
        }
      }
    })
    .sort({ createdAt: -1 })
    .execAsync();
  }
};

/**
 * @typedef Media
 */
export default mongoose.model('Media', MediaSchema);
