const getClients = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const clients = await req.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClient = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await req.prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { meetings: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, phone, company, notes, status } = req.body;

    const client = await req.prisma.client.create({
      data: { name, email, phone, company, notes, status },
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, notes, status } = req.body;

    const client = await req.prisma.client.update({
      where: { id },
      data: { name, email, phone, company, notes, status },
    });

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.client.delete({
      where: { id },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
};
