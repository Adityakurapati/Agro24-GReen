import React, { useState, useEffect } from "react";
import { ScrollView, View, Dimensions, Animated } from "react-native";
import { Card, Text, SegmentedButtons } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { LineChart } from "react-native-chart-kit";
import { cropPriceOptions, cropProductionOptions, statesWithDistricts } from "./data";

// Agriculture theme colors
const theme = {
  primary: "#2E7D32", // Dark Green
  secondary: "#81C784", // Light Green
  accent: "#43A047", // Medium Green
  background: "#F1F8E9", // Light Mint
  cardBg: "#FFFFFF",
  text: "#1B5E20", // Dark Forest Green
  chartGradientFrom: "#66BB6A", // Fresh Green
  chartGradientTo: "#43A047", // Medium Green
};

type StateName = keyof typeof statesWithDistricts;
type ChartData = {
  labels: string[];
  datasets: [{ data: number[] }];
};

const screenWidth = Dimensions.get("window").width;

const CropInformation: React.FC = ({ route }) => {
  const { url } = route.params || {};
  const [selectedState, setSelectedState] = useState<StateName>("Chhattisgarh");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [dataType, setDataType] = useState<"insights" | "prices">("insights");
  const [selectedCrop, setSelectedCrop] = useState<string>(
    dataType === "insights" ? cropProductionOptions[0] : cropPriceOptions[0]
  );
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }],
  });

  const chartConfig = {
    backgroundColor: theme.cardBg,
    backgroundGradientFrom: theme.chartGradientFrom,
    backgroundGradientTo: theme.chartGradientTo,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.accent,
    },
    strokeWidth: 3,
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchData = async () => {
    if (!selectedState || !selectedDistrict || !selectedCrop) return;

    try {
      const baseURL = dataType === "prices" ? `${url}/market_prize` : `${url}/market_insights`;
      const queryParams = new URLSearchParams({
        state: selectedState,
        city: selectedDistrict,
        crop_type: selectedCrop,
      }).toString();

      const response = await fetch(`${baseURL}?${queryParams}`);
      const result = await response.json();

      // Animate chart data update
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      setChartData({
        labels: result.map((item: any) => item.year.toString()),
        datasets: [{
          data: result.map((item: any) => dataType === "prices" ? item.price : item.value),
        }],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedState, selectedDistrict, selectedCrop, dataType]);

  useEffect(() => {
    setSelectedCrop(dataType === "insights" ? cropProductionOptions[0] : cropPriceOptions[0]);
  }, [dataType]);

  const pickerStyle = {
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  };

  return (
    <ScrollView style={{ backgroundColor: theme.background }}>
      <Animated.View 
        style={{ 
          padding: 16,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }}
      >
        <Card style={{ marginBottom: 16, backgroundColor: theme.cardBg, borderRadius: 16 }}>
          <Card.Content>
            <SegmentedButtons
              value={dataType}
              onValueChange={(value) => setDataType(value as "insights" | "prices")}
              buttons={[
                { 
                  value: "insights", 
                  label: "Production Data",
                  style: { backgroundColor: dataType === "insights" ? theme.primary : theme.cardBg }
                },
                { 
                  value: "prices", 
                  label: "Price Data",
                  style: { backgroundColor: dataType === "prices" ? theme.primary : theme.cardBg }
                },
              ]}
              style={{ marginBottom: 20 }}
            />

            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: theme.text }}>
              State:
            </Text>
            <View style={pickerStyle}>
              <Picker
                selectedValue={selectedState}
                onValueChange={(value: StateName) => {
                  setSelectedState(value);
                  setSelectedDistrict("");
                }}
                style={{ color: theme.text }}
              >
                {Object.keys(statesWithDistricts).map((state) => (
                  <Picker.Item key={state} label={state} value={state} color={theme.text} />
                ))}
              </Picker>
            </View>

            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: theme.text }}>
              District:
            </Text>
            <View style={pickerStyle}>
              <Picker
                selectedValue={selectedDistrict}
                onValueChange={(value: string) => setSelectedDistrict(value)}
                enabled={!!selectedState}
                style={{ color: theme.text }}
              >
                <Picker.Item label="Select District" value="" />
                {statesWithDistricts[selectedState].map((district) => (
                  <Picker.Item key={district} label={district} value={district} color={theme.text} />
                ))}
              </Picker>
            </View>

            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: theme.text }}>
              Crop Type:
            </Text>
            <View style={pickerStyle}>
              <Picker
                selectedValue={selectedCrop}
                onValueChange={(value: string) => setSelectedCrop(value)}
                style={{ color: theme.text }}
              >
                {(dataType === "insights" ? cropProductionOptions : cropPriceOptions)
                  .map((crop) => (
                    <Picker.Item key={crop} label={crop} value={crop} color={theme.text} />
                  ))}
              </Picker>
            </View>
          </Card.Content>
        </Card>

        {selectedDistrict && chartData.labels.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card style={{ backgroundColor: theme.cardBg, borderRadius: 16 }}>
              <Card.Title
                title={selectedCrop}
                subtitle={`${selectedDistrict}, ${selectedState}`}
                titleStyle={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}
                subtitleStyle={{ color: theme.secondary, fontSize: 16 }}
              />
              <Card.Content>
                <LineChart
                  data={chartData}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  verticalLabelRotation={30}
                  yAxisLabel={dataType === "prices" ? "₹" : ""}
                  yAxisSuffix={dataType === "prices" ? "" : " units"}
                />
              </Card.Content>
            </Card>
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

export default CropInformation;