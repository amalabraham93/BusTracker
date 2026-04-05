class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        return await this.model.create(data);
    }

    async findById(id) {
        return await this.model.findById(id);
    }

    async findOne(query) {
        return await this.model.findOne(query);
    }

    async findAll(query = {}, options = {}) {
        const { limit, skip, sort } = options;
        return await this.model.find(query).sort(sort).skip(skip).limit(limit);
    }

    /**
     * Advanced Finder with Pagination, Search, and Filtering
     * @param {Object} params { page, limit, search, searchFields, filter, sort, populate }
     */
    async findPaged({ page = 1, limit = 10, search = '', searchFields = [], filter = {}, sort = { createdAt: -1 }, populate = '' }) {
        const skip = (page - 1) * limit;
        let query = { ...filter };

        // 1. Handle Search (case-insensitive regex)
        if (search && searchFields.length > 0) {
            query.$or = searchFields.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }));
        }

        // 2. Execute Query
        let mongoQuery = this.model.find(query).sort(sort).skip(skip).limit(limit);

        // 3. Handle Populate
        if (populate) {
            mongoQuery = mongoQuery.populate(populate);
        }

        const [data, total] = await Promise.all([
            mongoQuery,
            this.model.countDocuments(query)
        ]);

        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        };
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id) {
        return await this.model.findByIdAndDelete(id);
    }
}

module.exports = BaseRepository;
