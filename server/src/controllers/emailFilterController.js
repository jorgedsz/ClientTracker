const gmailService = require('../services/gmailService');

const getFilters = async (req, res) => {
  try {
    const filters = await req.prisma.emailFilter.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(filters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFilter = async (req, res) => {
  try {
    const filter = await req.prisma.emailFilter.create({
      data: req.body,
    });

    res.status(201).json(filter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateFilter = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = await req.prisma.emailFilter.update({
      where: { id },
      data: req.body,
    });

    res.json(filter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFilter = async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.emailFilter.delete({
      where: { id },
    });

    res.json({ message: 'Filter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const testFilter = async (req, res) => {
  try {
    const { fromPattern, subjectPattern, bodyPattern } = req.body;

    const emails = await gmailService.getRecentEmails();

    const matches = emails.filter((email) => {
      let match = true;

      if (fromPattern) {
        const fromRegex = new RegExp(fromPattern, 'i');
        match = match && fromRegex.test(email.from);
      }

      if (subjectPattern) {
        const subjectRegex = new RegExp(subjectPattern, 'i');
        match = match && subjectRegex.test(email.subject);
      }

      if (bodyPattern) {
        const bodyRegex = new RegExp(bodyPattern, 'i');
        match = match && bodyRegex.test(email.body || '');
      }

      return match;
    });

    res.json({ total: emails.length, matches: matches.length, emails: matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFilters,
  createFilter,
  updateFilter,
  deleteFilter,
  testFilter,
};
