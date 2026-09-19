import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, {
  Line,
  Circle,
  Path,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { ChartDataPoint } from '../../types';
import { THEME } from '../../theme/colors';
import { formatDuration } from '../../utils/dateUtils';

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
  timeframeLabel?: string;
  timeframe?: '7d' | '12w' | '12m';
  showFitnessHeader?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 195,
  lineColor = '#F97316', // Vibrant Strava orange default
  fillColor,
  valuePrefix = '',
  valueSuffix = '',
  onPointPress,
  selectedIndex: propSelectedIndex,
  emptyMessage = 'No data available for this period',
  timeframeLabel,
  timeframe,
  showFitnessHeader = false,
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(
    data && data.length > 0 ? data.length - 1 : 0
  );

  // Sync selected index whenever data changes
  useEffect(() => {
    if (data && data.length > 0) {
      setInternalSelectedIndex(data.length - 1);
    }
  }, [data]);

  const activeIndex = propSelectedIndex !== undefined ? propSelectedIndex : internalSelectedIndex;

  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartWidth = containerWidth > 0 ? containerWidth : Math.max(260, windowWidth - 56);

  // Spacing
  const paddingTop = 16;
  const paddingBottom = 26;
  const paddingLeft = 14;
  const paddingRight = 48; // Room for right-aligned Y-axis labels

  const innerWidth = Math.max(10, chartWidth - paddingLeft - paddingRight);
  const innerHeight = Math.max(10, height - paddingTop - paddingBottom);

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
  const safeMax = maxValue === 0 ? 10 : maxValue * 1.15;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - (val / safeMax) * innerHeight;
  };

  // Build SVG Line Path
  let pathD = `M ${getX(0)} ${getY(data[0].value)}`;
  for (let i = 1; i < data.length; i++) {
    pathD += ` L ${getX(i)} ${getY(data[i].value)}`;
  }

  // Area under path
  const areaD = `${pathD} L ${getX(data.length - 1)} ${paddingTop + innerHeight} L ${getX(0)} ${paddingTop + innerHeight} Z`;

  // Horizontal guide lines (0, 50%, 100%)
  const gridLevels = [0, safeMax * 0.5, safeMax];

  const formatShortValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k`;
    return `${Number(val.toFixed(1))}`;
  };

  const selectedPoint = data[activeIndex] || data[data.length - 1];
  const selectedX = getX(activeIndex);
  const selectedY = selectedPoint ? getY(selectedPoint.value) : 0;

  const handlePointTap = (index: number, pt: ChartDataPoint) => {
    setInternalSelectedIndex(index);
    onPointPress?.(pt, index);
  };

  const gradientId = `fitness_grad_${Math.round(chartWidth)}`;

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerWidth) > 1) {
          setContainerWidth(w);
        }
      }}
    >
      {/* Strava Style Header */}
      {showFitnessHeader && selectedPoint && (() => {
        const getPointDurationMinutes = (point: ChartDataPoint): number => {
          if (point.durationMinutes !== undefined) return point.durationMinutes;
          if (point.durationHours !== undefined && point.durationHours > 0) return Math.round(point.durationHours * 60);
          if (point.distanceKm && point.speedKmh && point.speedKmh > 0) {
            return Math.round((point.distanceKm / point.speedKmh) * 60);
          }
          return 0;
        };
        const is7d = timeframe === '7d' || (timeframeLabel ? timeframeLabel.toLowerCase().includes('7') : false);
        const timeText = formatDuration(getPointDurationMinutes(selectedPoint), !is7d);

        return (
          <View style={styles.fitnessHeader}>
            {/* Active Period Date Header */}
            <Text style={styles.periodTitle}>
              {selectedPoint.periodTitle || selectedPoint.label}
            </Text>

            {/* 3-Column Key Metric Numbers - All same bold size */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text
                  style={styles.statNumber}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  {selectedPoint.distanceKm !== undefined
                    ? `${selectedPoint.distanceKm.toFixed(2)} km`
                    : `${Number(selectedPoint.value.toFixed(2))} km`}
                </Text>
              </View>

              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Steps</Text>
                <Text
                  style={styles.statNumber}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  {selectedPoint.steps !== undefined
                    ? `${selectedPoint.steps.toLocaleString()}`
                    : `${Math.round(selectedPoint.value).toLocaleString()}`}
                </Text>
              </View>

              <View style={[styles.statCol, styles.statColTime]}>
                <Text style={styles.statLabel}>Time</Text>
                <Text
                  style={styles.statNumber}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  {timeText}
                </Text>
              </View>
            </View>

            {/* Subtitle: Timeframe */}
            {timeframeLabel ? (
              <Text style={styles.timeframeSubtitle}>{timeframeLabel}</Text>
            ) : null}
          </View>
        );
      })()}

      {/* Standard Callout Pill if not in fitness header mode */}
      {!showFitnessHeader && selectedPoint && (
        <View style={styles.calloutPill}>
          <Text style={styles.calloutLabel}>{selectedPoint.label}: </Text>
          <Text style={styles.calloutValue}>
            {valuePrefix}
            {selectedPoint.value.toLocaleString()}
            {valueSuffix}
          </Text>
        </View>
      )}

      {/* SVG Canvas */}
      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={lineColor} stopOpacity="0.45" />
              <Stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Horizontal Grid lines with right-aligned Y labels */}
          {gridLevels.map((lvl, idx) => {
            const y = getY(lvl);
            return (
              <G key={`grid-${idx}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={THEME.bg.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={chartWidth - 6}
                  y={y + 3.5}
                  fill={THEME.text.tertiary}
                  fontSize={10}
                  fontWeight="500"
                  textAnchor="end"
                >
                  {valuePrefix}
                  {formatShortValue(lvl)}
                  {valueSuffix}
                </SvgText>
              </G>
            );
          })}

          {/* Gradient Area Fill */}
          <Path d={areaD} fill={`url(#${gradientId})`} />

          {/* Main Smooth Line */}
          <Path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical White Indicator Line through selected point */}
          {selectedPoint && (
            <Line
              x1={selectedX}
              y1={paddingTop - 4}
              x2={selectedX}
              y2={paddingTop + innerHeight}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}

          {/* Data Points */}
          {data.map((d, index) => {
            const x = getX(index);
            const y = getY(d.value);
            const isSelected = activeIndex === index;

            if (isSelected) {
              return (
                <G key={`pt-active-${index}`}>
                  {/* Outer glowing aura */}
                  <Circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill={lineColor}
                    fillOpacity={0.35}
                  />
                  {/* Inner solid dot with white rim */}
                  <Circle
                    cx={x}
                    cy={y}
                    r={5}
                    fill={lineColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </G>
              );
            }

            return (
              <Circle
                key={`pt-${index}`}
                cx={x}
                cy={y}
                r={3.5}
                fill={THEME.bg.card}
                stroke={lineColor}
                strokeWidth={1.8}
              />
            );
          })}

          {/* Bottom X-Axis Labels */}
          {data.map((d, index) => {
            // For 12-point charts, display every 2nd or 3rd label if tight
            if (data.length > 8 && index % 2 !== 0 && index !== data.length - 1) {
              return null;
            }

            const x = getX(index);
            const isSelected = activeIndex === index;

            return (
              <SvgText
                key={`xlabel-${index}`}
                x={x}
                y={height - 7}
                fill={isSelected ? '#FFFFFF' : THEME.text.tertiary}
                fontSize={10}
                fontWeight={isSelected ? '700' : '500'}
                textAnchor="middle"
              >
                {d.label.toUpperCase()}
              </SvgText>
            );
          })}
        </Svg>

        {/* Interactive Touch Overlay Layer */}
        <View style={[StyleSheet.absoluteFill, styles.touchRow, { paddingLeft, paddingRight }]}>
          {data.map((d, index) => (
            <TouchableOpacity
              key={`touch-${index}`}
              style={styles.touchCol}
              activeOpacity={0.8}
              onPress={() => handlePointTap(index, d)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  fitnessHeader: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  periodTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
    marginBottom: 8,
  },
  statCol: {
    flexShrink: 0,
  },
  statColTime: {
    flexShrink: 1,
  },
  statLabel: {
    color: THEME.text.secondary,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  timeframeSubtitle: {
    color: THEME.text.tertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  calloutPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg.input,
    borderWidth: 1,
    borderColor: THEME.bg.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  calloutLabel: {
    color: THEME.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  calloutValue: {
    color: THEME.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  svgWrapper: {
    position: 'relative',
    width: '100%',
  },
  touchRow: {
    flexDirection: 'row',
  },
  touchCol: {
    flex: 1,
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bg.card,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyText: {
    color: THEME.text.tertiary,
    fontSize: 13,
  },
});
