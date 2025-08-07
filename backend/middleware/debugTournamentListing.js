const debugTournamentListing = async (req, res, next) => {
  try {
    // Log incoming request details
    console.log('=== Tournament List Debug ===');
    console.log('Query Params:', req.query);
    console.log('Auth Headers:', {
      Authorization: req.headers.authorization ? 'Present' : 'Missing',
      AdminToken: req.headers['admin-token'] ? 'Present' : 'Missing'
    });

    // Test database connection and permissions
    const filter = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    
    // Try to count total tournaments
    const total = await Tournament.countDocuments(filter);
    console.log('Total tournaments in DB:', total);

    // Get a sample tournament
    const sample = await Tournament.findOne(filter).lean();
    console.log('Sample tournament:', sample ? {
      id: sample._id,
      title: sample.title,
      status: sample.status,
      isVisible: sample.isVisible,
      isPublic: sample.isPublic,
      createdAt: sample.createdAt
    } : 'No tournaments found');

    next();
  } catch (error) {
    console.error('=== Tournament Debug Error ===');
    console.error(error);
    next(error);
  }
};

module.exports = debugTournamentListing;
