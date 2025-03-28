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
    default: () => ({})
  }
});

const chartRef = ref(null);
let chart = null;
let resizeObserver = null;
const currentUser = ref('');
const statusOptions = ref([]);
const statusColors = ref({});

const colorPalette = [
  '#1E40AF', // Rich Blue
  '#2563EB', // Vivid Blue
  '#3B82F6', // Bright Blue
  '#60A5FA', // Soft Blue
  '#38BDF8', // Sky Blue
  '#0EA5E9', // Cyan
  '#06B6D4', // Aqua
  '#14B8A6', // Teal
  '#10B981', // Emerald Green
  '#22C55E', // Soft Green
  '#FACC15', // Warm Yellow
  '#FB923C', // Soft Orange
  '#F97316', // Deep Orange
  '#EF4444', // Coral Red
  '#EC4899', // Soft Pink
  '#A855F7', // Vibrant Purple
  '#7C3AED', // Deep Purple
  '#64748B', // Slate Gray
  '#94A3B8', // Light Gray
];



const fetchStatusOptions = async () => {
  try {
    const response = await fetch('/api/method/frappe.desk.form.load.getdoctype', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype: 'Issue' })
    });
    
    const data = await response.json();
    
    if (data.message && data.message.docs && data.message.docs[0]) {
      const doctypeDef = data.message.docs[0];
      const statusField = doctypeDef.fields.find(field => field.fieldname === 'status');
      
      if (statusField && statusField.options) {
        const options = statusField.options.split('\n').filter(opt => opt.trim());
        statusOptions.value = options;
        console.log('Available status options:', options);

        assignColorsToStatuses(options);
      }
    }
  } catch (error) {
    console.error('Error fetching status options:', error);
    statusOptions.value = ['Open', 'Replied', 'Closed', 'Resolved', 'On Hold'];
    assignColorsToStatuses(statusOptions.value);
  }
};


const assignColorsToStatuses = (options) => {
  const predefinedColors = {
    'Open': '#FF9F43',
    'Replied': '#7367F0',
    'Closed': '#28C76F',
    'Resolved': '#00CFE8',
    'On Hold': '#EA5455'
  };
  
  const newStatusColors = {};
  
  options.forEach((status, index) => {
    if (predefinedColors[status]) {
      newStatusColors[status] = predefinedColors[status];
    } else {
      const colorIndex = index % colorPalette.length;
      newStatusColors[status] = colorPalette[colorIndex];
    }
  });
  
  statusColors.value = newStatusColors;
  console.log('Status colors:', statusColors.value);
};

const getStatusColor = (status) => {
  return statusColors.value[status] || '#9CA3AF';
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

    if (statusOptions.value.length === 0) {
      await fetchStatusOptions();
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
    
    const userStatusCounts = {};
    statusOptions.value.forEach(status => {
      userStatusCounts[status] = 0;
    });

    if (data.message) {
      data.message.forEach(issue => {
        if (issue.status) {
          if (!userStatusCounts.hasOwnProperty(issue.status)) {
            userStatusCounts[issue.status] = 0;
            
            if (!statusOptions.value.includes(issue.status)) {
              statusOptions.value.push(issue.status);
              
              if (!statusColors.value[issue.status]) {
                const newIndex = statusOptions.value.length - 1;
                const colorIndex = newIndex % colorPalette.length;
                statusColors.value[issue.status] = colorPalette[colorIndex];
              }
            }
          }
          
          userStatusCounts[issue.status]++;
        }
      });
    }

    const filteredStatusCounts = {};
    Object.keys(userStatusCounts).forEach(status => {
      if (userStatusCounts[status] > 0) {
        filteredStatusCounts[status] = userStatusCounts[status];
      }
    });

    const statuses = Object.keys(filteredStatusCounts);
    const counts = Object.values(filteredStatusCounts);
    const colors = statuses.map(status => getStatusColor(status));
    const total = counts.reduce((sum, count) => sum + count, 0);

    const ctx = chartRef.value.getContext('2d');
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: statuses,
        datasets: [{
          data: counts,
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

onMounted(async () => {
  await fetchStatusOptions();
  
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