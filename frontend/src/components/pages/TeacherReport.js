import React from 'react';
import { Box, AppBar, Tabs, Tab, TextField, Button, Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const TeacherReportPage = () => {

  const data = [
    { course: 'Programming', teacher: 'Asra Masood', classroom: '401', section: 'BSSE-6-A', present: true },
    { course: 'DSA', teacher: 'Imran Ehsan', classroom: '403', section: 'BSSE-6-A', present: true },
    { course: 'HCI', teacher: 'Kanwal Batool', classroom: '405', section: 'BSSE-6-A', present: true },
    { course: 'SQE', teacher: 'Farooq', classroom: '407', section: 'BSSE-6-A', present: true },
  ];

  return (
    <Box>
      {/* App Bar with Tabs */}
      <AppBar position="static" style={{ backgroundColor: '#f5f5f5', boxShadow: 'none' }}>
        <Tabs value={0}>
          <Tab label="Home" style={{ color: '#000' }} />
          <Tab label="Report" style={{ color: '#000' }} />
        </Tabs>
      </AppBar>

      {/* Search and Timer */}
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Box display="flex" alignItems="center">
          <TextField variant="outlined" placeholder="Search" size="small" InputProps={{
            endAdornment: (
              <IconButton>
                <SearchIcon />
              </IconButton>
            )
          }} />
        </Box>
        <Box>
          <Typography variant="h5" style={{ color: 'red' }}>05:00</Typography>
        </Box>
      </Box>

      {/* Table Header with Filter */}
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h6">Filter</Typography>
        <Box display="flex" alignItems="center">
          <IconButton><ArrowUpwardIcon /></IconButton>
          <IconButton><ArrowDownwardIcon /></IconButton>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell>Teacher Name</TableCell>
              <TableCell>Classroom</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.course}</TableCell>
                <TableCell>{row.teacher}</TableCell>
                <TableCell>{row.classroom}</TableCell>
                <TableCell>{row.section}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    style={{
                      backgroundColor: row.present ? '#4caf50' : '#f44336',
                      color: '#fff'
                    }}
                  >
                    {row.present ? 'Present' : 'Absent'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default TeacherReportPage;
