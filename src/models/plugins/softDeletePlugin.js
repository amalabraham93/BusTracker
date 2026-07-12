module.exports = function softDeletePlugin(schema, options) {
    const excludeDeleted = function() {
        if (this.getFilter().isDeleted === undefined) {
            this.where({ isDeleted: { $ne: true } });
        }
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);

    // For aggregate, it's a bit different as getFilter is not available
    schema.pre('aggregate', function() {
        this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    });
};
