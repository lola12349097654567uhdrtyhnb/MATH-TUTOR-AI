'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MasteryAnalytics() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('average'); // 'average', 'fractions', 'algebra', 'exponents', 'geometry'
  const [hoveredStudent, setHoveredStudent] = useState(null);

  // Advanced Cohort Multi-Select and Date Filters
  const [selectedDate, setSelectedDate] = useState('all'); // 'all', 'today', 'tomorrow', or specific YYYY-MM-DD
  const [selectedGrade, setSelectedGrade] = useState('all'); // 'all', '7', '8'
  const [selectedPostAssessment, setSelectedPostAssessment] = useState('all'); // 'all', 'completed', 'pending'
  const [selectedStudents, setSelectedStudents] = useState([]); // Array of usernames
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userHeader = typeof window !== 'undefined' ? localStorage.getItem('session_user') || '' : '';
        const res = await fetch('/api/instructor/mastery-tracker', {
          headers: { 'x-user-id': userHeader }
        });
        if (res.ok) {
          const data = await res.json();
          const studentList = data.students || [];
          setStudents(studentList);
          // Pre-select all students initially
          setSelectedStudents(studentList.map(s => s.username));
        }
      } catch (err) {
        console.error('Failed to load mastery data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper: Extract unique active dates present in the classroom dataset
  const uniqueDates = Array.from(
    new Set(students.flatMap(s => s.active_dates || []))
  ).sort((a, b) => b.localeCompare(a));

  // Determine current active subset of students based on date filter
  const getFilteredByDateStudents = () => {
    if (selectedDate === 'all') return students;
    
    let targetDateStr = selectedDate;
    if (selectedDate === 'today') {
      targetDateStr = new Date().toISOString().split('T')[0];
    } else if (selectedDate === 'tomorrow') {
      targetDateStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    return students.filter(s => s.active_dates && s.active_dates.includes(targetDateStr));
  };

  const dateFilteredStudents = getFilteredByDateStudents();

  // Filter by grade level
  const gradeFilteredStudents = dateFilteredStudents.filter(s => {
    if (selectedGrade === 'all') return true;
    return s.grade === selectedGrade;
  });

  // Filter by post-assessment status
  const postAssessmentFilteredStudents = gradeFilteredStudents.filter(s => {
    if (selectedPostAssessment === 'all') return true;
    if (selectedPostAssessment === 'completed') return s.post_assessment_completed;
    return !s.post_assessment_completed;
  });

  // Further narrow down by chosen students (checkboxes)
  const finalFilteredStudents = postAssessmentFilteredStudents.filter(s => 
    selectedStudents.includes(s.username)
  );

  // Helper: Export to CSV (Perfect for thesis data appendices!)
  const exportToCSV = () => {
    const headers = [
      'Student Name',
      'Grade',
      'Active Practice Hours',
      'Total Questions Answered',
      'Average BKT Mastery (%)',
      'Fractions Mastery',
      'Algebra Mastery',
      'Exponents Mastery',
      'Geometry Mastery',
      'Topics Graduated',
      'Rate of Learning (Topics/Hour)',
      'Pre-Assessment Done',
      'Post-Assessment Done',
      'Survey Done',
      'Last Active Date'
    ];

    const rows = finalFilteredStudents.map(s => [
      s.username,
      s.grade ? `Grade ${s.grade}` : 'N/A',
      s.active_hours.toFixed(2),
      s.questions_answered,
      s.average_mastery,
      Math.round(s.mastery_scores.fractions * 100),
      Math.round(s.mastery_scores.algebra * 100),
      Math.round(s.mastery_scores.exponents * 100),
      Math.round(s.mastery_scores.geometry * 100),
      s.topics_graduated,
      s.rate_of_learning.toFixed(2),
      s.pre_assessment_completed ? 'Yes' : 'No',
      s.post_assessment_completed ? 'Yes' : 'No',
      s.survey_completed ? 'Yes' : 'No',
      s.last_active_date || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `academic_mastery_dataset_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{textAlign: 'center', padding: '100px'}}><i className="fa-solid fa-spinner fa-spin fa-3x" style={{color: 'var(--primary)'}}></i></div>;
  }

  // Filter plotted points based on selected topic
  const points = finalFilteredStudents.map(s => {
    const yValue = selectedTopic === 'average' 
      ? s.average_mastery 
      : Math.round((s.mastery_scores[selectedTopic] || 0) * 100);
    return {
      x: s.active_hours,
      y: yValue,
      label: s.username,
      graduated: s.topics_graduated,
      rate: s.rate_of_learning,
      raw: s
    };
  });

  // Calculate linear regression metrics (least-squares method: y = mx + c)
  const calculateRegressionLine = (pts) => {
    if (pts.length < 2) return null;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = pts.length;
    
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });
    
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null;
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };

  const regression = calculateRegressionLine(points);

  // SVG dimensions
  const width = 800;
  const height = 400;
  const padding = 50;

  // X range bounds: [0, max X or at least 5]
  const maxX = Math.max(...points.map(p => p.x), 5);
  // Y range bounds: [0, 100]
  const maxY = 100;

  // Scale functions
  const scaleX = (x) => padding + (x / maxX) * (width - 2 * padding);
  const scaleY = (y) => height - padding - (y / maxY) * (height - 2 * padding);

  // Render SVG Regression Line
  const renderRegressionPath = () => {
    if (!regression) return null;
    const { slope, intercept } = regression;
    const x1 = 0;
    const y1 = Math.max(0, Math.min(100, slope * x1 + intercept));
    const x2 = maxX;
    const y2 = Math.max(0, Math.min(100, slope * x2 + intercept));

    return (
      <line 
        x1={scaleX(x1)} 
        y1={scaleY(y1)} 
        x2={scaleX(x2)} 
        y2={scaleY(y2)} 
        stroke="rgba(139, 92, 246, 0.7)" 
        strokeWidth="3" 
        strokeDasharray="6,4" 
        style={{ filter: 'drop-shadow(0px 0px 8px rgba(139,92,246,0.5))' }}
      />
    );
  };

  // Class aggregates
  const classAvgMastery = finalFilteredStudents.length > 0 
    ? Math.round(finalFilteredStudents.reduce((acc, s) => acc + s.average_mastery, 0) / finalFilteredStudents.length) 
    : 0;

  const classAvgActiveHours = finalFilteredStudents.length > 0
    ? (finalFilteredStudents.reduce((acc, s) => acc + s.active_hours, 0) / finalFilteredStudents.length).toFixed(2)
    : '0.00';

  const classAvgRate = finalFilteredStudents.length > 0
    ? (finalFilteredStudents.reduce((acc, s) => acc + s.rate_of_learning, 0) / finalFilteredStudents.length).toFixed(2)
    : '0.00';

  return (
    <div className="container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="title">Academic Mastery Analytics</h1>
          <p className="subtitle">Visualizing cognitive rate of learning and Bayesian Knowledge Tracing metrics for your thesis.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <i className="fa-solid fa-file-csv"></i> Export Dataset (.CSV)
          </button>
          <Link href="/instructor/overview" className="btn btn-secondary">
            Back to Overview
          </Link>
        </div>
      </header>

      {/* Global Filters & Cohort Management Panel */}
      <div className="card" style={{ 
        padding: '20px 24px', 
        marginBottom: '25px', 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              borderRadius: '12px', 
              padding: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid rgba(139, 92, 246, 0.2)' 
            }}>
              <i className="fa-solid fa-filter" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '600' }}>Active Cohort Filters</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>Narrow down student metrics by login/activity date and select target study participants.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
            {/* Login / Active Date Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Login/Activity Date</label>
              <select 
                value={selectedDate} 
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  // Dynamic behavior: When date changes, auto-select all students in that day's cohort matching current grade and post filter
                  let filteredByDate = [];
                  if (e.target.value === 'all') {
                    filteredByDate = students;
                  } else {
                    let targetDateStr = e.target.value;
                    if (e.target.value === 'today') {
                      targetDateStr = new Date().toISOString().split('T')[0];
                    } else if (e.target.value === 'tomorrow') {
                      targetDateStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    }
                    filteredByDate = students.filter(s => s.active_dates && s.active_dates.includes(targetDateStr));
                  }
                  
                  const newlyFilteredByGrade = filteredByDate.filter(s => {
                    if (selectedGrade === 'all') return true;
                    return s.grade === selectedGrade;
                  });
                  const newlyFilteredByPost = newlyFilteredByGrade.filter(s => {
                    if (selectedPostAssessment === 'all') return true;
                    if (selectedPostAssessment === 'completed') return s.post_assessment_completed;
                    return !s.post_assessment_completed;
                  });
                  setSelectedStudents(newlyFilteredByPost.map(s => s.username));
                }} 
                style={{ 
                  width: '210px', 
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem',
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1.5px solid rgba(139, 92, 246, 0.5)',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <option value="all">📅 All Activity Dates</option>
                <option value="today">📅 Active Today</option>
                <option value="tomorrow">📅 Active Tomorrow</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>📅 {date}</option>
                ))}
              </select>
            </div>

            {/* Grade Level Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade Level</label>
              <select 
                value={selectedGrade} 
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  let filteredByDate = [];
                  if (selectedDate === 'all') {
                    filteredByDate = students;
                  } else {
                    let targetDateStr = selectedDate;
                    if (selectedDate === 'today') {
                      targetDateStr = new Date().toISOString().split('T')[0];
                    } else if (selectedDate === 'tomorrow') {
                      targetDateStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    }
                    filteredByDate = students.filter(s => s.active_dates && s.active_dates.includes(targetDateStr));
                  }
                  
                  const newlyFilteredByGrade = filteredByDate.filter(s => {
                    if (e.target.value === 'all') return true;
                    return s.grade === e.target.value;
                  });
                  const newlyFilteredByPost = newlyFilteredByGrade.filter(s => {
                    if (selectedPostAssessment === 'all') return true;
                    if (selectedPostAssessment === 'completed') return s.post_assessment_completed;
                    return !s.post_assessment_completed;
                  });
                  setSelectedStudents(newlyFilteredByPost.map(s => s.username));
                }} 
                style={{ 
                  width: '140px', 
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem',
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1.5px solid rgba(139, 92, 246, 0.5)',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <option value="all">🎓 All Grades</option>
                <option value="7">🎓 Grade 7</option>
                <option value="8">🎓 Grade 8</option>
              </select>
            </div>

            {/* Post-Assessment Status Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Post-Assessment</label>
              <select 
                value={selectedPostAssessment} 
                onChange={(e) => {
                  setSelectedPostAssessment(e.target.value);
                  let filteredByDate = [];
                  if (selectedDate === 'all') {
                    filteredByDate = students;
                  } else {
                    let targetDateStr = selectedDate;
                    if (selectedDate === 'today') {
                      targetDateStr = new Date().toISOString().split('T')[0];
                    } else if (selectedDate === 'tomorrow') {
                      targetDateStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    }
                    filteredByDate = students.filter(s => s.active_dates && s.active_dates.includes(targetDateStr));
                  }
                  
                  const newlyFilteredByGrade = filteredByDate.filter(s => {
                    if (selectedGrade === 'all') return true;
                    return s.grade === selectedGrade;
                  });
                  const newlyFilteredByPost = newlyFilteredByGrade.filter(s => {
                    if (e.target.value === 'all') return true;
                    if (e.target.value === 'completed') return s.post_assessment_completed;
                    return !s.post_assessment_completed;
                  });
                  setSelectedStudents(newlyFilteredByPost.map(s => s.username));
                }} 
                style={{ 
                  width: '180px', 
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem',
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1.5px solid rgba(139, 92, 246, 0.5)',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <option value="all">📝 All Students</option>
                <option value="completed">📝 Completed Only</option>
                <option value="pending">📝 Pending Only</option>
              </select>
            </div>

            {/* Student Selector Multi-Select Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', position: 'relative' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Target Students</label>
              <button 
                type="button"
                onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                className="btn btn-secondary"
                style={{ 
                  width: '230px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 16px', 
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  background: '#1e293b',
                  border: '1.5px solid rgba(139, 92, 246, 0.5)',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-users" style={{ color: 'var(--primary)' }}></i>
                  {selectedStudents.length === postAssessmentFilteredStudents.length 
                    ? 'All Cohort Selected' 
                    : `Selected: ${selectedStudents.length} / ${postAssessmentFilteredStudents.length}`}
                </span>
                <i className={`fa-solid fa-chevron-${showStudentDropdown ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
              </button>

              {showStudentDropdown && (
                <>
                  {/* Backdrop for closing dropdown on clicking outside */}
                  <div 
                    onClick={() => setShowStudentDropdown(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99, background: 'transparent' }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0, 
                    zIndex: 100, 
                    width: '280px', 
                    marginTop: '6px',
                    padding: '12px',
                    background: 'rgba(20, 24, 45, 0.98)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {/* Search box inside dropdown */}
                    <input 
                      type="text" 
                      placeholder="🔍 Search username..." 
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{ 
                        padding: '6px 10px', 
                        fontSize: '0.8rem', 
                        borderRadius: '6px', 
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        outline: 'none'
                      }} 
                    />

                    {/* Quick Select Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '0 2px' }}>
                      <button 
                        type="button"
                        onClick={() => setSelectedStudents(postAssessmentFilteredStudents.map(s => s.username))}
                        style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                      >
                        Select All Cohort
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedStudents([])}
                        style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}
                      >
                        Clear All
                      </button>
                    </div>

                    {/* List of Student checkboxes */}
                    <div style={{ 
                      maxHeight: '180px', 
                      overflowY: 'auto', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '4px',
                      paddingTop: '4px'
                    }}>
                      {postAssessmentFilteredStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                          No active students found for this cohort.
                        </div>
                      ) : (
                        postAssessmentFilteredStudents
                          .filter(s => s.username.toLowerCase().includes(studentSearch.toLowerCase()))
                          .map(s => {
                            const isChecked = selectedStudents.includes(s.username);
                            return (
                              <label 
                                key={s.username} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  fontSize: '0.8rem', 
                                  cursor: 'pointer',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  background: isChecked ? 'rgba(139,92,246,0.12)' : 'transparent',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedStudents(selectedStudents.filter(u => u !== s.username));
                                    } else {
                                      setSelectedStudents([...selectedStudents, s.username]);
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span style={{ color: isChecked ? '#fff' : 'var(--muted)' }}>{s.username}</span>
                              </label>
                            );
                          })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class Average Mastery</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: 'var(--primary)' }}>{classAvgMastery}%</div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Combined Bayesian BKT belief level</p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Active Practicing</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#38bdf8' }}>{classAvgActiveHours} hrs</div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Active sessionized practice duration</p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Learning Curve Slope</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#10b981' }}>
            {regression ? `+${regression.slope.toFixed(2)}` : 'N/A'}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Mastery growth rate per active hour</p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Learning Efficiency</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', color: '#fbbf24' }}>{classAvgRate}</div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Topics graduated per practice hour</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' }} className="responsive-column-grid">
        {/* Interactive Scatter Plot Card */}
        <div className="card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-chart-line" style={{ color: 'var(--primary)' }}></i> BKT Mastery Level vs. Active Practice Hours
              </h2>
              <p className="section-note" style={{ margin: 0 }}>Every point is a student. Dotted line indicates the class cognitive acquisition curve.</p>
            </div>
            
            {/* Filter Selector */}
            <select 
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)} 
              style={{ width: 'auto', padding: '8px 30px 8px 12px', borderRadius: '10px', fontSize: '0.9rem' }}
            >
              <option value="average">Combined Average Mastery</option>
              <option value="fractions">Fractions Unit Mastery</option>
              <option value="algebra">Algebraic Equations Mastery</option>
              <option value="exponents">Exponents Unit Mastery</option>
              <option value="geometry">Geometry Unit Mastery</option>
            </select>
          </div>

          {/* Interactive SVG Plot */}
          <div style={{ width: '100%', overflowX: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <svg width={width} height={height} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
              {/* Glowing Background Grid Lines */}
              {[0, 20, 40, 60, 80, 100].map(y => (
                <g key={y}>
                  <line 
                    x1={padding} 
                    y1={scaleY(y)} 
                    x2={width - padding} 
                    y2={scaleY(y)} 
                    stroke="rgba(255,255,255,0.04)" 
                    strokeWidth="1"
                  />
                  <text 
                    x={padding - 10} 
                    y={scaleY(y) + 4} 
                    fill="var(--muted)" 
                    fontSize="0.75rem" 
                    textAnchor="end"
                  >
                    {y}%
                  </text>
                </g>
              ))}

              {/* X Axis division grid */}
              {[...Array(6).keys()].map(i => {
                const xVal = (i * maxX) / 5;
                return (
                  <g key={i}>
                    <line 
                      x1={scaleX(xVal)} 
                      y1={padding} 
                      x2={scaleX(xVal)} 
                      y2={height - padding} 
                      stroke="rgba(255,255,255,0.04)" 
                      strokeWidth="1"
                    />
                    <text 
                      x={scaleX(xVal)} 
                      y={height - padding + 18} 
                      fill="var(--muted)" 
                      fontSize="0.75rem" 
                      textAnchor="middle"
                    >
                      {xVal.toFixed(1)} hrs
                    </text>
                  </g>
                );
              })}

              {/* Render Trend Line */}
              {renderRegressionPath()}

              {/* Render Scatter Points */}
              {points.map((p, idx) => {
                const scaledX = scaleX(p.x);
                const scaledY = scaleY(p.y);
                const isHovered = hoveredStudent?.username === p.label;

                return (
                  <g 
                    key={idx} 
                    onMouseEnter={() => setHoveredStudent(p.raw)}
                    onMouseLeave={() => setHoveredStudent(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Outer hover rings */}
                    <circle 
                      cx={scaledX} 
                      cy={scaledY} 
                      r={isHovered ? 14 : 7} 
                      fill="rgba(139, 92, 246, 0.25)" 
                      style={{ transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                    />
                    {/* Core glowing dot */}
                    <circle 
                      cx={scaledX} 
                      cy={scaledY} 
                      r={5} 
                      fill={p.y >= 90 ? '#10b981' : (p.y >= 50 ? '#38bdf8' : '#a855f7')} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {/* Student Name tags rendered directly on graph */}
                    <text
                      x={scaledX}
                      y={scaledY - 10}
                      fill={isHovered ? '#ffffff' : 'rgba(255,255,255,0.45)'}
                      fontSize="0.7rem"
                      fontWeight={isHovered ? '700' : '400'}
                      textAnchor="middle"
                      style={{ transition: 'all 0.15s' }}
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}

              {/* Axes Labels */}
              <text 
                x={width / 2} 
                y={height - 10} 
                fill="var(--text)" 
                fontSize="0.85rem" 
                fontWeight="600"
                textAnchor="middle"
              >
                Active Learning Duration on Platform (Hours)
              </text>
              <text 
                x={15} 
                y={height / 2} 
                fill="var(--text)" 
                fontSize="0.85rem" 
                fontWeight="600"
                transform={`rotate(-90 15 ${height / 2})`}
                textAnchor="middle"
              >
                BKT Mastery Level Progress (%)
              </text>
            </svg>
          </div>
        </div>

        {/* Live Detail Hover Info Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '15px' }}>
                <i className="fa-solid fa-graduation-cap"></i> Interactive Selector Details
              </h3>
              {hoveredStudent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>STUDENT NAME</span>
                    <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{hoveredStudent.username}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>PLATFORM ENGAGEMENT</span>
                    <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{hoveredStudent.active_hours.toFixed(2)} Active Hours</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2px' }}>{hoveredStudent.questions_answered} questions answered</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase' }}>BKT ACQUISITION RATE</span>
                    <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{hoveredStudent.topics_graduated} focus topics mastered</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2px' }}>Learning Rate: {hoveredStudent.rate_of_learning.toFixed(2)} topics/hour</div>
                  </div>
                  <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>INDIVIDUAL FOCUS SCORES:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                      <div>Fractions: <strong style={{ color: '#c084fc' }}>{Math.round(hoveredStudent.mastery_scores.fractions * 100)}%</strong></div>
                      <div>Algebra: <strong style={{ color: '#c084fc' }}>{Math.round(hoveredStudent.mastery_scores.algebra * 100)}%</strong></div>
                      <div>Exponents: <strong style={{ color: '#c084fc' }}>{Math.round(hoveredStudent.mastery_scores.exponents * 100)}%</strong></div>
                      <div>Geometry: <strong style={{ color: '#c084fc' }}>{Math.round(hoveredStudent.mastery_scores.geometry * 100)}%</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                  <i className="fa-solid fa-arrow-pointer" style={{ fontSize: '2rem', display: 'block', marginBottom: '15px', color: 'var(--primary)' }}></i>
                  Hover over any student dot on the scatter plot to inspect their thesis metrics!
                </div>
              )}
            </div>

            {regression && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px', marginTop: '15px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <strong>Class Learning Curve Formula:</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--primary)', marginTop: '4px' }}>
                  y = {regression.slope.toFixed(2)}x + {regression.intercept.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px', lineHeight: '1.3' }}>
                  Represents student BKT mastery level growth per practicing hour. Perfect to copy directly into your paper!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highly Readable Publication Table (Word/LaTeX-ready layout!) */}
      <div className="card" style={{ marginBottom: '40px', padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className="section-title">Classroom Mastery & Engagement Dataset</h2>
            <p className="section-note" style={{ margin: 0 }}>Active clickstream sessionized analytics dataset for all participating students.</p>
          </div>
          <button className="btn btn-secondary" onClick={exportToCSV} style={{ fontSize: '0.88rem' }}>
            <i className="fa-solid fa-download"></i> Download CSV Table
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text)' }}>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700' }}>STUDENT NAME</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>GRADE</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>ACTIVE HOURS</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>QUESTIONS</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>MASTERED TOPICS</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>AVG BKT BELIEF</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>LEARNING EFFICIENCY</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>PRE</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>POST</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>SURVEY</th>
                <th style={{ padding: '12px 8px', fontSize: '0.88rem', fontWeight: '700', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {finalFilteredStudents.map((stu, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'all 0.15s' }} className="table-row-hover">
                  <td style={{ padding: '14px 8px', fontWeight: '700', color: '#fff' }}>{stu.username}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', color: '#fbbf24', fontWeight: '600' }}>
                    {stu.grade ? `Grade ${stu.grade}` : 'N/A'}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: '600' }}>{stu.active_hours.toFixed(2)} hrs</td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--muted)' }}>{stu.questions_answered}</td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>{stu.topics_graduated} / 4</td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--primary)', fontWeight: '700' }}>{stu.average_mastery}%</td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', color: '#fbbf24', fontWeight: '600' }}>{stu.rate_of_learning.toFixed(2)} / hr</td>
                  
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    {stu.pre_assessment_completed ? (
                      <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>Done</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '6px' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    {stu.post_assessment_completed ? (
                      <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>Done</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '6px' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    {stu.survey_completed ? (
                      <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>Done</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '6px' }}>Pending</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <Link href={`/instructor/student-detail?student=${stu.username}`} className="btn" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', background: 'var(--highlight)', border: '1px solid var(--border)' }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thesis Reference & Methodology Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(20, 24, 45, 0.65), rgba(13, 17, 33, 0.85))', 
        border: '1px solid rgba(139, 92, 246, 0.25)', 
        padding: '30px', 
        borderRadius: '24px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px', color: 'var(--primary)' }}>
          <i className="fa-solid fa-scroll"></i> Methodology & Thesis Drafting Reference
        </h2>
        <p style={{ color: '#d1d5db', fontSize: '0.96rem', lineHeight: '1.6', margin: '0 0 16px' }}>
          This page utilizes data extraction and mathematical modeling built specifically for academic presentation. You can use the following definitions and details directly in the **Methodology & Results** sections of your university thesis:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="responsive-column-grid">
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '0.96rem', fontWeight: '700' }}>1. Bayesian Knowledge Tracing (BKT)</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.4' }}>
              Student mastery levels are computed dynamically at each step utilizing the standard BKT hidden Markov model updating:
              <br />
              <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', display: 'block', margin: '8px 0', color: 'var(--primary)', fontFamily: 'monospace' }}>
                P(L_t | Action) = P(L_(t-1)) * (1 - P(Forget)) / ...
              </code>
              A student is defined to have mastered a specific mathematical focus topic when their belief updates yield <code style={{ color: 'var(--primary)' }}>P(L_t) &ge; 0.95</code>, unlocking Graduation.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '0.96rem', fontWeight: '700' }}>2. Active Clickstream Sessionization</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.4' }}>
              To provide a high-fidelity cognitive acquisition metric, time active on the website is filtered dynamically. We calculate active engagement intervals by grouping raw log timestamps using a <strong style={{ color: '#38bdf8' }}>15-minute clickstream threshold</strong>. This effectively filters out idle background page states, yielding an extremely accurate practicing time value for academic modeling.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .table-row-hover:hover {
          background: rgba(139, 92, 246, 0.05) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 800px) {
          .responsive-column-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
