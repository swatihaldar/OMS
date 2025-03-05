<template>
  <div class="chart-container relative w-full h-full">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  statusCounts: {
    type: Object,
    required: true,
    default: () => ({
      Open: 0,
      Replied: 0,
      Closed: 0,
      Resolved: 0,
      'On Hold': 0
    })
  }
});

const chartRef = ref(null);
let chart = null;
let resizeObserver = null;
const currentUser = ref('');

const getStatusColor = (status) => {
  switch (status) {
    case 'Open': return '#F59E0B';
    case 'Replied': return '#8B5CF6';
    case 'Closed': return '#10B981';
    case 'Resolved': return '#3B82F6';
    case 'On Hold': return '#9CA3AF';
    default: return '#D1D5DB';
  }
};

const createChart = async () => {
  if (chart) {
    chart.destroy();
  }

  if (!chartRef.value) return;

  try {
    // Get current user if not already fetched
    if (!currentUser.value) {
      const userResponse = await fetch('/api/method/frappe.auth.get_logged_user');
      const userData = await userResponse.json();
      currentUser.value = userData.message;
    }

    // Fetch status counts for current user
    const response = await fetch('/api/method/frappe.client.get_list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctype: 'Issue',
        fields: ['status'],
        filters: { raised_by: currentUser.value },
        limit_page_length: 1000,
        limit_start: 0
      })
    });

    const data = await response.json();
    const userStatusCounts = {
      Open: 0,
      Replied: 0,
      Closed: 0,
      Resolved: 0,
      'On Hold': 0
    };

    if (data.message) {
      data.message.forEach(issue => {
        if (userStatusCounts.hasOwnProperty(issue.status)) {
          userStatusCounts[issue.status]++;
        }
      });
    }

    const total = Object.values(userStatusCounts).reduce((sum, count) => sum + count, 0);
    const colors = Object.keys(userStatusCounts).map(status => getStatusColor(status));

    // Create the chart
    const ctx = chartRef.value.getContext('2d');
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(userStatusCounts),
        datasets: [{
          data: Object.values(userStatusCounts),
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        layout: {
          padding: {
            top: 10,
            bottom: 10
          }
        },
        plugins: {
          legend: {
            position: window.innerWidth < 768 ? 'bottom' : 'right',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart) {
          const width = chart.width;
          const height = chart.height;
          const ctx = chart.ctx;
          
          ctx.restore();
          
          const fontSize = width < 400 ? 12 : 14;
          const valueFontSize = width < 400 ? 20 : 24;
          
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = '#888888';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('My Issues', width / 2, height / 2 - 15);
          
          ctx.font = `bold ${valueFontSize}px Arial`;
          ctx.fillStyle = '#333333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(total.toLocaleString(), width / 2, height / 2 + 15);
          
          ctx.save();
        }
      }]
    });
  } catch (error) {
    console.error('Error creating chart:', error);
  }
};

const handleResize = () => {
  if (chart) {
    chart.options.plugins.legend.position = window.innerWidth < 768 ? 'bottom' : 'right';
    chart.update();
  }
};

onMounted(() => {
  createChart();
  
  resizeObserver = new ResizeObserver(() => {
    if (chart) {
      chart.resize();
      handleResize();
    }
  });
  
  if (chartRef.value) {
    resizeObserver.observe(chartRef.value.parentElement);
  }
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
  window.removeEventListener('resize', handleResize);
  
  if (chart) {
    chart.destroy();
  }
});

watch(() => props.statusCounts, createChart, { deep: true });
</script>