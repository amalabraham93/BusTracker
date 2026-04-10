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
    async findPaged({ page, limit, search = '', searchFields = [], filter = {}, sort = { createdAt: -1 }, populate = '' }) {
        let query = { ...filter };

        // 1. Handle Search (case-insensitive regex)
        if (search && searchFields.length > 0) {
            query.$or = searchFields.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }));
        }

        // 2. Prepare Query
        let mongoQuery = this.model.find(query).sort(sort);

        // 3. Handle Pagination (Optional)
        const isPaging = limit !== undefined && limit !== null && limit !== '';
        if (isPaging) {
            const p = Number(page) || 1;
            const l = Number(limit);
            const skip = (p - 1) * l;
            mongoQuery = mongoQuery.skip(skip).limit(l);
        }

        // 4. Handle Populate
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
            page: isPaging ? Number(page || 1) : 1,
            limit: isPaging ? Number(limit) : total,
            totalPages: isPaging ? Math.ceil(total / Number(limit)) : 1
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
