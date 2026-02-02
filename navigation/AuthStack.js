import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';


const Stack = createNativeStackNavigator();


export default function AuthStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Login" options={{ headerShown: false }} component={LoginScreen} />
            <Stack.Screen name="Register" options={{ headerShown: false }} component={RegisterScreen} />
            <Stack.Screen name="OTP" options={{ headerShown: false }} component={OTPScreen} />
            <Stack.Screen name="ProfileSetup" options={{ headerShown: false }} component={ProfileSetupScreen} />
        </Stack.Navigator>
    );
}