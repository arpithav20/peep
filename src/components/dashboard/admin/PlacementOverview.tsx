import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, MapPin, Calendar, User, Briefcase, Loader } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import * as jspdfAutoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface Placement {
  id: string;
  userId: string;
  studentName: string;
  company: string;
  position: string;
  location: string;
  salary: number;
  status: 'applied' | 'interview' | 'offered' | 'accepted' | 'rejected';
  appliedAt: Date;
  notes?: string;
}

const PlacementOverview: React.FC = () => {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    setLoading(true);
    try {
      // Fetch placements
      const placementsSnapshot = await getDocs(collection(db, 'placements'));
      
      // Fetch users to get student names
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap = new Map();
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        usersMap.set(doc.id, userData.name);
      });

      const placementsData = placementsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        appliedAt: doc.data().appliedAt?.toDate() || new Date(),
        studentName: usersMap.get(doc.data().userId) || 'Unknown Student'
      })) as Placement[];

      setPlacements(placementsData);
    } catch (error) {
      console.error('Error fetching placements:', error);
      toast.error('Failed to fetch placement data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlacements = placements.filter(placement => {
    const matchesSearch = 
      placement.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || placement.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-700';
      case 'interview':
        return 'bg-yellow-100 text-yellow-700';
      case 'offered':
        return 'bg-purple-100 text-purple-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: placements.length,
    active: placements.filter(p => ['applied', 'interview', 'offered'].includes(p.status)).length,
    placed: placements.filter(p => p.status === 'accepted').length,
    placementRate: placements.length > 0 ? Math.round((placements.filter(p => p.status === 'accepted').length / placements.length) * 100) : 0
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Placement Overview Report', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Add statistics
    doc.setFontSize(14);
    doc.text('Summary Statistics:', 20, 55);
    doc.setFontSize(12);
    doc.text(`Total Applications: ${stats.total}`, 20, 70);
    doc.text(`Active Applications: ${stats.active}`, 20, 80);
    doc.text(`Successfully Placed: ${stats.placed}`, 20, 90);
    doc.text(`Placement Rate: ${stats.placementRate}%`, 20, 100);
    
    // Add table
    const tableData = filteredPlacements.map(placement => [
      placement.studentName,
      placement.company,
      placement.position,
      placement.location,
      placement.salary ? `$${placement.salary.toLocaleString()}` : 'N/A',
      placement.status,
      placement.appliedAt.toLocaleDateString()
    ]);
    
    (doc as any).autoTable({
      head: [['Student', 'Company', 'Position', 'Location', 'Salary', 'Status', 'Applied Date']],
      body: tableData,
      startY: 120,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save('placement-report.pdf');
    toast.success('PDF report downloaded successfully!');
  };

  const exportToWord = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Placement Overview Report",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `Generated on: ${new Date().toLocaleDateString()}`,
            }),
            new Paragraph({
              text: "",
            }),
            new Paragraph({
              text: "Summary Statistics:",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Total Applications: ${stats.total}`, break: 1 }),
                new TextRun({ text: `Active Applications: ${stats.active}`, break: 1 }),
                new TextRun({ text: `Successfully Placed: ${stats.placed}`, break: 1 }),
                new TextRun({ text: `Placement Rate: ${stats.placementRate}%`, break: 1 }),
              ],
            }),
            new Paragraph({
              text: "",
            }),
            new Paragraph({
              text: "Detailed Placement Data:",
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Student")] }),
                    new TableCell({ children: [new Paragraph("Company")] }),
                    new TableCell({ children: [new Paragraph("Position")] }),
                    new TableCell({ children: [new Paragraph("Location")] }),
                    new TableCell({ children: [new Paragraph("Salary")] }),
                    new TableCell({ children: [new Paragraph("Status")] }),
                    new TableCell({ children: [new Paragraph("Applied Date")] }),
                  ],
                }),
                ...filteredPlacements.map(placement => 
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(placement.studentName)] }),
                      new TableCell({ children: [new Paragraph(placement.company)] }),
                      new TableCell({ children: [new Paragraph(placement.position)] }),
                      new TableCell({ children: [new Paragraph(placement.location)] }),
                      new TableCell({ children: [new Paragraph(placement.salary ? `$${placement.salary.toLocaleString()}` : 'N/A')] }),
                      new TableCell({ children: [new Paragraph(placement.status)] }),
                      new TableCell({ children: [new Paragraph(placement.appliedAt.toLocaleDateString())] }),
                    ],
                  })
                ),
              ],
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, 'placement-report.docx');
      toast.success('Word report downloaded successfully!');
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast.error('Failed to generate Word report');
    }
  };

  const handleExportReport = () => {
    const choice = window.confirm('Choose format:\nOK for PDF\nCancel for Word');
    if (choice) {
      exportToPDF();
    } else {
      exportToWord();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Placement Overview</h2>
          <p className="text-gray-600">Monitor student placement activities and success rates</p>
        </div>
        <button 
          onClick={handleExportReport}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Successfully Placed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.placed}</p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Placement Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.placementRate}%</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">{stats.placementRate}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search students, companies, or positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offered">Offered</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Placements Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlacements.map((placement) => (
                <tr key={placement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {placement.studentName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{placement.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{placement.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {placement.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${placement.salary?.toLocaleString() || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(placement.status)}`}>
                      {placement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {placement.appliedAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlacements.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No placements found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No placement applications have been submitted yet'
              }
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PlacementOverview;