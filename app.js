require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// ============ Middleware ============
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ============ MySQL Connection Pool ============
console.log('🔍 Database Configuration:');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('User:', process.env.DB_USER || 'root');
console.log('Database:', process.env.DB_NAME || 'sawaed');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sawaed',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ============ Initialize Database ============
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Create volunteers table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS volunteers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullName VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                city VARCHAR(100),
                skills TEXT,
                interests TEXT,
                experience TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create organizations table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS organizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                city VARCHAR(100),
                type VARCHAR(100),
                description TEXT,
                website VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create opportunities table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS opportunities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                organizationId INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                city VARCHAR(100),
                field VARCHAR(100),
                startDate DATE,
                endDate DATE,
                volunteersNeeded INT,
                requirements TEXT,
                status VARCHAR(50) DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organizationId) REFERENCES organizations(id)
            )
        `);

        // Create contact_messages table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                message TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create applications table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                volunteerId INT NOT NULL,
                opportunityId INT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (volunteerId) REFERENCES volunteers(id),
                FOREIGN KEY (opportunityId) REFERENCES opportunities(id)
            )
        `);

        connection.release();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

// ============ API Routes ============

// Get Statistics
app.get('/api/statistics', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [volunteers] = await connection.execute('SELECT COUNT(*) as count FROM volunteers');
        const [organizations] = await connection.execute('SELECT COUNT(*) as count FROM organizations');
        const [opportunities] = await connection.execute('SELECT COUNT(*) as count FROM opportunities');
        
        connection.release();
        
        res.json({
            volunteersCount: volunteers[0].count,
            organizationsCount: organizations[0].count,
            opportunitiesCount: opportunities[0].count
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Opportunities
app.get('/api/opportunities', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [opportunities] = await connection.execute(`
            SELECT o.*, org.name as organizationName 
            FROM opportunities o 
            JOIN organizations org ON o.organizationId = org.id 
            WHERE o.status = 'active'
        `);
        connection.release();
        
        res.json(opportunities);
    } catch (error) {
        console.error('Error getting opportunities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Opportunity Details
app.get('/api/opportunities/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [opportunities] = await connection.execute(`
            SELECT o.*, org.name as organizationName 
            FROM opportunities o 
            JOIN organizations org ON o.organizationId = org.id 
            WHERE o.id = ?
        `, [req.params.id]);
        connection.release();
        
        if (opportunities.length === 0) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        
        res.json(opportunities[0]);
    } catch (error) {
        console.error('Error getting opportunity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register Volunteer
app.post('/api/volunteers', async (req, res) => {
    try {
        const { fullName, email, phone, city, skills, interests, experience } = req.body;
        
        console.log('📝 Registering volunteer:', { fullName, email });
        
        if (!fullName || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const connection = await pool.getConnection();
        
        try {
            await connection.execute(
                'INSERT INTO volunteers (fullName, email, phone, city, skills, interests, experience) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [fullName, email, phone, city, skills, interests, experience]
            );
            console.log('✅ Volunteer registered successfully');
            res.json({ message: 'Volunteer registered successfully', success: true });
        } catch (dbError) {
            if (dbError.code === 'ER_DUP_ENTRY') {
                console.log('❌ Email already exists');
                return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
            }
            throw dbError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error registering volunteer:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// Register Organization
app.post('/api/organizations', async (req, res) => {
    try {
        const { name, email, phone, city, type, description, website } = req.body;
        
        console.log('📝 Registering organization:', { name, email });
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const connection = await pool.getConnection();
        
        try {
            const result = await connection.execute(
                'INSERT INTO organizations (name, email, phone, city, type, description, website) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone, city, type, description, website]
            );
            const orgId = result[0].insertId;
            console.log('✅ Organization registered successfully with ID:', orgId);
            res.json({ id: orgId, message: 'Organization registered successfully', success: true });
        } catch (dbError) {
            if (dbError.code === 'ER_DUP_ENTRY') {
                console.log('❌ Email already exists');
                return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
            }
            throw dbError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error registering organization:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// Submit Contact Message
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        console.log('📝 Contact message received:', { name, email });
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const connection = await pool.getConnection();
        
        try {
            await connection.execute(
                'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
                [name, email, subject, message]
            );
            console.log('✅ Contact message saved successfully');
            res.json({ message: 'Message sent successfully', success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error sending contact message:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// Add Opportunity
app.post('/api/opportunities', async (req, res) => {
    try {
        const { organizationId, title, field, city, description, volunteersNeeded, requirements, startDate, endDate, status } = req.body;
        
        console.log('📝 Adding opportunity:', { organizationId, title });
        
        if (!organizationId || !title || !field || !city || !description || !volunteersNeeded || !requirements || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const connection = await pool.getConnection();
        
        try {
            await connection.execute(
                'INSERT INTO opportunities (organizationId, title, field, city, description, volunteersNeeded, requirements, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [organizationId, title, field, city, description, volunteersNeeded, requirements, startDate, endDate, status || 'active']
            );
            console.log('✅ Opportunity added successfully');
            res.json({ message: 'Opportunity added successfully', success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error adding opportunity:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// Submit Volunteer Application
app.post('/api/applications', async (req, res) => {
    try {
        const { volunteerId, opportunityId } = req.body;
        
        if (!volunteerId || !opportunityId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const connection = await pool.getConnection();
        
        try {
            const result = await connection.execute(
                'INSERT INTO organizations (name, email, phone, city, type, description, website) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone, city, type, description, website]
            );
            
            const orgId = result[0].insertId;
            console.log('✅ Organization registered successfully with ID:', orgId);
            res.json({ id: orgId, message: 'Organization registered successfully', success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ error: 'حدث خطأ في الخادم' });
    }
});

// Get All Volunteers (Admin)
app.get('/api/admin/volunteers', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [volunteers] = await connection.execute('SELECT * FROM volunteers');
        connection.release();
        
        res.json(volunteers);
    } catch (error) {
        console.error('Error getting volunteers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Organizations (Admin)
app.get('/api/admin/organizations', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [organizations] = await connection.execute('SELECT * FROM organizations');
        connection.release();
        
        res.json(organizations);
    } catch (error) {
        console.error('Error getting organizations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Organization Opportunities
app.get('/api/admin/opportunities/:orgId', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [opportunities] = await connection.execute(
            'SELECT * FROM opportunities WHERE organizationId = ? ORDER BY createdAt DESC',
            [req.params.orgId]
        );
        connection.release();
        
        res.json(opportunities);
    } catch (error) {
        console.error('Error getting opportunities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Applications for Organization
app.get('/api/admin/applications/:orgId', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [applications] = await connection.execute(`
            SELECT 
                a.id,
                a.createdAt,
                v.id as volunteerId,
                v.fullName as volunteerName,
                v.email as volunteerEmail,
                v.phone as volunteerPhone,
                o.id as opportunityId,
                o.title as opportunityTitle
            FROM applications a
            JOIN volunteers v ON a.volunteerId = v.id
            JOIN opportunities o ON a.opportunityId = o.id
            WHERE o.organizationId = ?
            ORDER BY a.createdAt DESC
        `, [req.params.orgId]);
        connection.release();
        
        res.json(applications);
    } catch (error) {
        console.error('Error getting applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Contact Messages (Admin)
app.get('/api/admin/contact-messages', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [messages] = await connection.execute('SELECT * FROM contact_messages ORDER BY createdAt DESC');
        connection.release();
        
        res.json(messages);
    } catch (error) {
        console.error('Error getting contact messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get volunteer profile
app.get('/api/volunteers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [volunteers] = await connection.execute('SELECT * FROM volunteers WHERE id = ?', [id]);
        connection.release();
        
        if (volunteers.length === 0) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }
        res.json(volunteers[0]);
    } catch (error) {
        console.error('Error fetching volunteer:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get volunteer applications
app.get('/api/volunteers/:id/applications', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [applications] = await connection.execute(`
            SELECT a.*, o.title as opportunityTitle, o.field, org.name as organizationName
            FROM applications a
            JOIN opportunities o ON a.opportunityId = o.id
            JOIN organizations org ON o.organizationId = org.id
            WHERE a.volunteerId = ?
        `, [id]);
        connection.release();
        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get organization profile
app.get('/api/organizations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [orgs] = await connection.execute('SELECT * FROM organizations WHERE id = ?', [id]);
        connection.release();
        
        if (orgs.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        res.json(orgs[0]);
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete opportunity
app.delete('/api/opportunities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.execute('DELETE FROM applications WHERE opportunityId = ?', [id]);
        await connection.execute('DELETE FROM opportunities WHERE id = ?', [id]);
        connection.release();
        res.json({ message: 'Opportunity deleted successfully', success: true });
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============ Start Server ============
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════╗
║   🎉 Sawaed Server is Running! 🎉     ║
║   http://localhost:${PORT}                 ║
╚════════════════════════════════════════╝
        `);
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = app;