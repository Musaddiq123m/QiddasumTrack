import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { ChartDataPoint } from '../../types';

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  lineColor?: string;
  fillColor?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  onPointPress?: (point: ChartDataPoint, index: number) => void;
  selectedIndex?: number;
  emptyMessage?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  lineColor = '#10B981',
  fillColor = 'rgba(16, 185, 129, 0.12)',
  valuePrefix = '',
  valueSuffix = '',
  onPointPress,
  selectedIndex,
  emptyMessage = 'No data available for this period',
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(300, screenWidth - 48); // 24px padding on each side
  const paddingBottom = 32;
  const paddingTop = 24;
  const paddingHorizontal = 24;

  const innerWidth = chartWidth - paddingHorizontal * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  if (!data || data.length === 0 || !hasData) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const safeMax = maxValue === 0 ? 10 : maxValue * 1.15; // 15% headroom

  const getX = (index: number) => {
    if (data.length === 1) return paddingHorizontal + innerWidth / 2;
    return paddingHorizontal + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - (val / safeMax) * innerHeight;
  };

  // Build SVG Path
  let pathD = `M ${getX(0)} ${getY(data[0].value)}`;
  for (let i = 1; i < data.length; i++) {
    pathD += ` L ${getX(i)} ${getY(data[i].value)}`;
  }

  // Area under path
  const areaD = `${pathD} L ${getX(data.length - 1)} ${paddingTop + innerHeight} L ${getX(0)} ${paddingTop + innerHeight} Z`;

  // Horizontal guide lines (3 lines)
  const gridLevels = [0, safeMax * 0.5, safeMax];

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* Horizontal Grid lines */}
        {gridLevels.map((lvl, idx) => {
          const y = getY(lvl);
          return (
            <G key={`grid-${idx}`}>
              <Line
                x1={paddingHorizontal}
                y1={y}
                x2={chartWidth - paddingHorizontal}
                y2={y}
                stroke="#334155"
                strokeDasharray="4, 4"
                strokeWidth={1}
              />
              <SvgText
                x={paddingHorizontal}
                y={y - 4}
                fill="#94A3B8"
                fontSize={10}
                fontWeight="500"
              >
                {valuePrefix}
                {Math.round(lvl) >= 1000 ? `${(Math.round(lvl) / 1000).toFixed(0)}k` : Math.round(lvl)}
                {valueSuffix}
              </SvgText>
            </G>
          );
        })}

        {/* Fill Area */}
        <Path d={areaD} fill={fillColor} />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points & Labels */}
        {data.map((d, index) => {
          const x = getX(index);
          const y = getY(d.value);
          const isSelected = selectedIndex === index;

          return (
            <G key={`point-${index}`}>
              {/* Point circle */}
              <Circle
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill={isSelected ? '#FFFFFF' : lineColor}
                stroke={isSelected ? lineColor : '#0F172A'}
                strokeWidth={2}
              />
              {/* Bottom Label */}
              <SvgText
                x={x}
                y={height - 8}
                fill={isSelected ? '#F8FAFC' : '#94A3B8'}
                fontSize={10}
                fontWeight={isSelected ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Touch overlays for interactive tapping */}
      {onPointPress && (
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', paddingHorizontal }]}>
          {data.map((d, index) => (
            <TouchableOpacity
              key={`touch-${index}`}
              style={{ flex: 1, height: '100%' }}
              activeOpacity={0.7}
              onPress={() => onPointPress(d, index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
