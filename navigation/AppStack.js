import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import OwnerRegistrationScreen from '../screens/OwnerRegistrationScreen';
import PostTripScreen from '../screens/PostTripScreen';
import GarageScreen from '../screens/GarageScreen';
import MyJourneysScreen from '../screens/MyJourneysScreen';
import TripRequestsScreen from '../screens/TripRequestsScreen';
import TripDetailsScreen from '../screens/TripDetailsScreen';
import DriverRegistrationScreen from '../screens/DriverRegistrationScreen';
import DigilockerVerificationScreen from '../screens/DigilockerVerificationScreen';
import UserDocumentsScreen from '../screens/UserDocumentsScreen';


const Stack = createNativeStackNavigator();

export default function AppStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="RoleSelection">
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="OwnerRegistration" component={OwnerRegistrationScreen} />
            <Stack.Screen name="PostTrip" component={PostTripScreen} />
            <Stack.Screen name="Garage" component={GarageScreen} />
            <Stack.Screen name="MyJourneys" component={MyJourneysScreen} />
            <Stack.Screen name="TripRequests" component={TripRequestsScreen} />
            <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
            <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
            <Stack.Screen name="DigilockerVerification" component={DigilockerVerificationScreen} />
            <Stack.Screen name="UserDocuments" component={UserDocumentsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        </Stack.Navigator>
    );
}