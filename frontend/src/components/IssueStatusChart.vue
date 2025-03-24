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
    case 'Open': return '#FF9F43'; 
    case 'Replied': return '#7367F0'; 
    case 'Closed': return '#28C76F'; 
    case 'Resolved': return '#00CFE8'; 
    case 'On Hold': return '#EA5455'; 
    default: return '#9CA3AF'; 
  }
};

const createChart = async () => {
  if (chart) {
    chart.destroy();
  }

  if (!chartRef.value) return;

  try {
    if (!currentUser.value) {
      const userResponse = await fetch('/api/method/frappe.auth.get_logged_user');
      const userData = await userResponse.json();
      currentUser.value = userData.message;
    }


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

    // Create the chart with improved styling
    const ctx = chartRef.value.getContext('2d');
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(userStatusCounts),
        datasets: [{
          data: Object.values(userStatusCounts),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20
          }
        },
        plugins: {
          legend: {
            position: window.innerWidth < 768 ? 'bottom' : 'right',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { 
                size: 12,
                weight: 'bold'
              },
              color: '#4B5563'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#111827',
            bodyColor: '#4B5563',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            cornerRadius: 8,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000,
          easing: 'easeOutQuart'
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
          const valueFontSize = width < 400 ? 24 : 30;
          
          ctx.font = `${fontSize}px 'Inter', sans-serif`;
          ctx.fillStyle = '#6B7280';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('My Issues', width / 2, height / 2 - 20);
          
          ctx.font = `bold ${valueFontSize}px 'Inter', sans-serif`;
          ctx.fillStyle = '#111827';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(total.toLocaleString(), width / 2, height / 2 + 10);
          
          ctx.font = `${fontSize}px 'Inter', sans-serif`;
          ctx.fillStyle = '#6B7280';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Total', width / 2, height / 2 + 35);
          
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

