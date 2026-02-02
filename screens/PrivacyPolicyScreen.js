import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// If using Expo:
import { Ionicons } from '@expo/vector-icons';
import { SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const termsData = [
    {
        id: 1,
        title: "1. General condition of use",
        icon: "document-text-outline",
        content: `1.1 Scope and definitions

These Terms & Conditions govern and regulate the use of th e Drive share mobile and web-based application. By accessing, browsing, or utilizing any service within the Platform, users acknowledge and agree to be bound by these Terms. The Platform is designed to facilitate a unique travel-assistance service for individuals seeking convenient and cost-effective long-distance travel options.

1.2 Purpose of the Platform

The primary function of the Platform is to connect two types of users for mutually beneficial travel arrangements.

1.2.1 Car Owners
Individuals who intend to travel long distances but may not be able—or may not prefer—to drive for extended durations. These users can request a skilled and verified Drivers to drive their vehicle for the planned trip.

1.2.2 Drivers
Individuals who wish to travel to a particular destination but may not have access to a personal vehicle or the financial means for long-distance transportation. By offering to drive the Car Owner’s vehicle, they gain the opportunity to travel without incurring high travel costs.

The Platform acts solely as a digital intermediary, enabling communication, coordination, and arrangement of travel between Car Owners and Drivers. It does not provide transportation, employment, or vehicle rental services directly.

1.3 Acceptance of Terms

By creating an account, accessing the Platform, or using any of its features, users expressly acknowledge and agree to comply with these Terms, along with all applicable policies, guidelines, and safety rules referenced herein. Continued use of the Platform constitutes ongoing acceptance of any updates or modifications to these Terms.

1.4 Right to Decline

If a user does not agree with any part of these Terms, they must discontinue the use of the Platform immediately. Continued access or usage will be considered as acceptance of the Terms in full.`
    },
    {
        id: 2,
        title: "2. ELIGIBILITY",
        icon: "id-card-outline",
        content: `2.1 General Requirements
To register for, access, or use the Platform, all users must meet the following minimum eligibility criteria:

2.1.1 Minimum Age Requirement
Users must be at least 18 years of age at the time of registration. By accessing the Platform, users confirm that they meet the legal age requirement to enter into binding agreements.

2.1.2 Valid Government Identification
Users are required to provide a valid government-issued identity document (such as Aadhaar, PAN, Passport, or Driving License) for verification, security, and compliance purposes. The Platform may request re-verification at any time.

2.1.3 Active Contact Information
Users must maintain an active mobile number and email address to receive communications, alerts, transaction updates, and verification codes. Users are responsible for ensuring their contact details remain up to date.

2.2 Additional Requirements for Drivers
Individuals registering as Drivers — those who will drive the Car Owner’s vehicle in exchange for travel — must fulfill the following:

2.2.1 Valid Driving License
Drivers must possess a valid, original driving license recognized by the relevant transport authority. The license must be valid for the type of vehicle being driven.

2.2.2 Clean Conduct & Offense Declaration
Drivers must declare that they do not have any major criminal background or serious traffic offense history. The Platform reserves the right to conduct additional checks or deny access if any discrepancies or safety concerns arise.

2.3 Additional Requirements for Car Owners
Individuals registering as Car Owners — those who offer their vehicle to be driven by a Drivers — must ensure the following:

2.3.1 Valid Vehicle Registration Certificate (RC)
Car Owners must provide an up-to-date and legally valid Registration Certificate (RC) for the vehicle that will be used on the Platform.

2.3.2 Insurance & Pollution Certificate
Car Owners must ensure the vehicle has: Valid motor insurance (third-party or comprehensive, as required by law) and A current Pollution Under Control (PUC) certificate. These documents must be valid throughout the duration of any trip arranged through the Platform.

2.3.3 Vehicle Safety & Compliance
Car Owners must ensure that the vehicle is in good mechanical condition, complies with all legal safety standards, and is fit for long-distance travel. The Platform may request periodic documentation or self-certification of vehicle condition.`
    },
    {
        id: 3,
        title: "3. USER ROLES & RESPONSIBILITIES",
        icon: "people-outline",
        content: `3.1 Car Owner Responsibilities

3.1.1 Maintain a Legally Compliant Vehicle
The Car Owner must ensure that the vehicle provided for the trip is legally compliant and safe for road use. This includes maintaining a properly registered vehicle, having valid motor insurance, and ensuring the vehicle is in good working condition. The vehicle must also meet all required safety, servicing, and emission standards as mandated by transportation authorities. It is the responsibility of the Car Owner to make sure the vehicle is roadworthy before handing it over for the trip.

3.1.2 Verify Driver Credentials
Before permitting the Driver to drive the vehicle, the Car Owner must verify that the Travel Seeker holds a valid and active driving license recognized by authorities. The Car Owner should cross-check the Driver’s identity with the government-issued ID provided and ensure the details match. It is important for the Car Owner to confirm that they are comfortable and confident with the Driver’s driving ability before starting the journey.

3.1.3 Provide Clear and Accurate Trip Information
The Car Owner must provide accurate and complete information related to the planned trip. This includes clearly specifying the pickup location, destination, scheduled date, time, and expected duration of the journey. The Car Owner must also inform the Driver about the current condition of the vehicle, mention any pre-existing damages, and provide any special instructions related to vehicle operation or safety. Clear communication helps ensure transparency and reduces misunderstandings during the trip.

3.1.4 Bear All Vehicle-Related Costs
All costs associated with the vehicle remain the responsibility of the Car Owner. This includes fuel expenses, toll charges, parking fees, regular maintenance, and repairs. Additionally, any insurance claims or documentation required for the trip or for unforeseen incidents fall under the Car Owner’s responsibility. The Car Owner acknowledges that the Driver is only responsible for driving the vehicle and is not financially accountable for typical operational expenses.

3.1.5 Non-Commercial Use
The Car Owner must understand that the Platform facilitates travel convenience and is not intended for commercial ride-hiring services. Therefore, the Car Owner is strictly prohibited from charging the Driver for the ride, as the arrangement is based solely on the Driver driving in exchange for travel. The service may only be used for personal travel assistance and must not be used for offering paid rides or running any transport business.

3.2 Driver Responsibilities

3.2.1 Hold Valid Driving Credentials
The Driver must possess a valid driving license issued by the appropriate authorities and must be physically and mentally fit to drive. The Travel Seeker is responsible for ensuring that all submitted information regarding their driving eligibility is accurate and truthful. If they have any medical condition or limitation that may affect driving, they must disclose it to the Car Owner before starting the trip.

3.2.2 Drive Responsibly Throughout the Journey
The Driver is required to drive the vehicle responsibly and safely during the entire agreed journey. They must handle the vehicle carefully, avoid unnecessary risks, and ensure the safety of all passengers and road users. The Driver must complete the agreed route unless changes are mutually discussed and approved by the Car Owner.

3.2.3 Non-Commercial Activity
The Driver must not demand or accept any form of payment from the Car Owner for driving services. Their participation is solely based on the agreed exchange—driving the Car Owner’s vehicle in order to complete their own travel. The Platform or the Car Owner must not be used to operate as a paid driving service or commercial activity.

3.2.4 Adhere to All Driving and Safety Regulations
The Driver must follow all applicable traffic rules, road safety regulations, and speed limits throughout the journey. They are expected to drive with caution, obey road signs, and follow safe driving practices. The Driver must also comply with any reasonable instructions provided by the Car Owner regarding the operation or handling of the vehicle.

3.2.5 Immediate Reporting Obligations
If any incident occurs during the trip, the Driver must promptly inform the Car Owner. This includes accidents, mechanical issues, abnormal vehicle behavior, or any condition that may affect the safety of the journey. In the event of a breakdown or unexpected situation, the Driver must act responsibly, ensure passenger safety, and follow the Car Owner’s guidance or emergency support protocols.

3.2.6 Strict Prohibitions
The Driver is strictly prohibited from engaging in any unsafe or unlawful activities while driving the Car Owner’s vehicle. This includes speeding, aggressive or rash driving, consuming alcohol or drugs before or during the trip, and participating in any illegal activities. The Driver must also refrain from allowing anyone else to drive the vehicle without the Car Owner’s explicit approval.`
    },
    {
        id: 4,
        title: "4. Platform Responsibilities & Limitations",
        icon: "layers-outline",
        content: `4.1 Platform as a Match-Making Service
The Platform functions solely as a digital match-making service designed to connect Car Owners with Drivers for mutually beneficial travel arrangements. Its role is limited to providing a space where users can discover and communicate with one another. The Platform does not participate in, supervise, or control any interactions, agreements, or arrangements made between users beyond the initial connection.

4.2 No Verification of User Background, Experience, or Vehicle Condition
The Platform does not independently verify or validate any user-provided details. This includes user background, meaning the Platform does not conduct criminal, employment, or personal history checks; driving experience, including a user’s driving skills, on-road behavior, or past driving records; and vehicle condition, such as maintenance status, safety features, mechanical reliability, or legal compliance of the vehicle. All users are responsible for assessing and confirming the authenticity and accuracy of the information shared by other users.

4.3 No Guarantee of Safety, Trip Availability, or Information Accuracy
The Platform does not provide any guarantee regarding the safety of users during or after the trip, as all journey-related activities occur independently outside the Platform’s control. It also does not assure the availability of trips, as trip postings, acceptances, and cancellations are entirely determined by users. Furthermore, the Platform cannot guarantee the accuracy of user information, since all details—including identity, trip routes, timings, vehicle details, and driving capability—are supplied directly by users and not verified by the Platform.

4.4 No Liability for Accidents, Damages, Injuries, or Lost Items
The Platform is not liable for any unfortunate incidents that may occur as a result of user interactions. This includes accidents or collisions during the journey, damage to the vehicle whether mechanical or physical, injuries sustained by any user, and lost items or personal belongings misplaced or stolen during the trip. All such events are solely the responsibility of the individuals involved, and users agree not to hold the Platform accountable under any circumstances.

4.5 Not Responsible for User Disputes
Any disputes, disagreements, or conflicts that arise between Car Owners and Drivers—related to behavior, trip timing, responsibilities, safety, payments, or any other matter—must be resolved directly between the parties involved. The Platform does not mediate, intervene, or take responsibility for settling such issues.`
    },
    {
        id: 5,
        title: "5. Vehicle Safety & Damage Policy",
        icon: "car-sport-outline",
        content: `5.1 Responsibilities of Car Owners
Car Owners acknowledge and agree that the drivers will operate their vehicle solely at the Car Owner’s discretion and authorization. The Car Owner assumes full responsibility for any incidents, including but not limited to accidents, damages, repairs, insurance claims, or third-party liabilities arising during the trip.
All insurance claims must be raised and settled exclusively by the Car Owner under their valid motor insurance policy.
The Car Owner agrees not to charge, recover, or claim any form of compensation from the Driver for damages, repairs, insurance deductibles, or any associated costs.

5.2 Responsibilities of Drivers
Travel Seekers are expected to operate the vehicle responsibly, follow traffic rules, and ensure safe driving at all times.
While Driver must exercise due care and comply with road safety norms, they will not be held financially liable for accidents, damages, or insurance-related expenses. Any vehicle-related damage, repair cost, or insurance procedure must be handled exclusively by the Car Owner.`
    },
    {
        id: 6,
        title: "6. BOOKING, CANCELLATION & NO-SHOW",
        icon: "calendar-outline",
        content: `6.1 Accuracy of Booking Information
Users must provide complete, accurate, and up-to-date trip details at the time of booking. Any misleading or incomplete information may result in cancellation of the booking or restrictions being placed on the user’s account.

6.2 Cancellation Guidelines
Cancellations must be completed within the permitted time window as specified on the Platform. Late cancellations may also impact the user’s ability to make future bookings.

6.3 No-Show Policy
Users are expected to adhere to their confirmed trip schedule. Repeated no-shows create inconvenience for other users and disrupt the service flow. In such cases, the Platform may temporarily suspend the user’s account based on the frequency of incidents. Continued no-show behaviour may further result in permanent removal of the user from the Platform to maintain service reliability.

6.4 Mandatory Response Window
To ensure smooth coordination and avoid last-minute disruptions, both Car Owners and Drivers are required to respond to booking confirmations or essential communications at least Three hours before the scheduled ride time. If either party fails to respond within this mandatory window, the Platform may automatically reassign the booking to another eligible Car Owner or Drivers. This measure ensures timely communication and enhances reliability for users depending on the service.`
    },
    {
        id: 7,
        title: "7. PAYMENTS & FEES",
        icon: "wallet-outline",
        content: `7.1 No Financial Transactions Between Users
The Platform operates purely on a mutual-benefit model, where the Car Owner provides the vehicle and destination details, and the Driver drives the vehicle in exchange for transportation. As a result, no monetary exchange, payment, or compensation of any kind is permitted or required between Car Owners and Driver. Users agree that all interactions are voluntary and based solely on shared travel convenience, not financial gain.

7.2 No Platform Charges or Penalties
The Platform does not impose any subscription fees, service fees, verification charges, penalties, or hidden costs. All features provided by the Platform are offered free of charge, and users are not required to make any payment at any stage of using the service.

7.3 No In-App or Third-Party Transaction Processing
Since the Platform does not facilitate or support any financial activity, no payment gateway, online transaction mechanism, or banking integration is used. Users are not required to provide credit card details, banking information, or digital wallet data for using the Platform.

7.4 Strict Prohibition of Unofficial Payments
Although the Platform itself is free, users are strictly prohibited from requesting, offering, or accepting any external or offline payments (cash or digital). This ensures that the service remains fair, transparent, and aligned with its purpose of mutual benefit without financial involvement. Any violation of this principle may lead to review of the user's account or removal from the Platform.`
    },
    {
        id: 8,
        title: "8. USER VERIFICATION",
        icon: "checkmark-circle-outline",
        content: `8.1 To ensure safety, trust, and authenticity within the Platform, all users may be required to undergo a verification process. The Platform reserves the right to request, review, and validate user information at any stage of registration or usage.

8.2 Government-Issued Identification
Users may be asked to submit a valid government-issued identification document (such as Aadhaar, PAN, Passport, or Driving License) for identity confirmation. This helps the Platform verify that the user is a real individual and meets the eligibility criteria.

8.3 Driving License Verification
Driver may be required to upload a clear and valid copy of their driving license. This verification ensures that the individual driving the Car Owner’s vehicle is legally permitted to operate a motor vehicle. The Platform may also review the license's expiry date and overall validity.

8.4 Vehicle Document Verification (For Car Owners)
Car Owners may be required to submit essential vehicle-related documents, including the Registration Certificate (RC), insurance papers, pollution certificate, and any other legally mandated documents. This ensures that the vehicle being offered is compliant with applicable laws and safe for use.

8.5 Selfie or Profile Verification
For additional security, users may be required to complete a selfie verification or upload a real-time photograph. This step helps confirm that the person creating or operating the account matches the submitted identification documents, reducing the risk of fraudulent profiles.

8.6 Contact Information Verification
Users may be required to verify their mobile number and email address through one-time passwords (OTP) or other verification methods. Verified contact information ensures smooth communication between users and the Platform regarding trip updates, notifications, or safety alerts.

8.7 The Platform reserves the right to deny access, suspend, or terminate accounts that fail verification requirements or provide false or misleading information.`
    },
    {
        id: 9,
        title: "9. SAFETY GUIDELINES",
        icon: "shield-half-outline",
        content: `9.1 General Safety Requirements
All users are required to adhere to the safety protocols established by the Platform to ensure a secure and responsible travel experience. This includes consistently wearing seat belts throughout the journey to minimize risks during transit. Users must also obey all applicable traffic rules, including speed limits, to promote safe and lawful driving practices.

9.2 Use of Safety Features
The Platform provides built-in safety tools such as SOS buttons and emergency assistance features. Users are encouraged to utilize these features promptly in situations involving distress, danger, or immediate support needs. There will be live location sharing option for you in order to be safe while journey.

9.3 Zero-Tolerance Safety Policy
The Platform enforces a strict zero-tolerance policy against any form of harassment, abuse, discrimination, or illegal activity. Any user found engaging in such conduct may face immediate account suspension, investigation, and permanent removal from the Platform. The safety and well-being of all users is the Platform’s highest priority, and such behavior will not be tolerated under any circumstances.`
    },
    {
        id: 10,
        title: "10. PRIVACY POLICY",
        icon: "lock-closed-outline",
        content: `This Privacy Policy explains in detail how Drive share collects, uses, stores, shares, and protects your personal information when you access or use our mobile and web-based application. By creating an account or continuing to use the Platform, you acknowledge that you have read, understood, and agreed to the practices described in this Privacy Policy.

1. INFORMATION WE COLLECT

1.1 Personal Information
We collect personal information to verify user identity, maintain account integrity, and ensure a safe and trustworthy environment. This includes your full name, date of birth, government-issued identification such as Aadhaar, PAN card, or driving license, as well as your email address, active mobile number, and profile photograph. We may also request your residential address or region if it is required to support verification processes or enhance user safety. This information is essential to authenticate you as a legitimate user and protect both Car Owners and Driver from fraudulent activity.

1.2 Vehicle & Driving Information
For Car Owners and Drivers, we gather specific information related to driving and vehicle ownership. Drivers may be required to provide their driving license details to establish their eligibility and compliance with legal driving standards. Car Owners may need to upload their vehicle registration documents, insurance papers, and compliance records to confirm that the vehicle is roadworthy and legally permitted for travel. This helps maintain transparency and ensures that all vehicles being used on the Platform meet safety and regulatory requirements.

1.3 Trip & Usage Information
We collect detailed information about your trip preferences, travel locations, routes, dates, and times, along with a complete history of past trips. This allows the Platform to provide accurate and efficient trip matching, ensuring that Car Owners are paired with suitable Drivers. Additionally, communication exchanged through in-app messaging—such as trip confirmations, questions, or discussions is stored to maintain a record of interactions. This is done to support safety, improve dispute resolution, and enhance overall service reliability.

1.4 Technical & Device Information
When you use the Platform, we automatically collect technical details from your device, such as the type of device you use, the operating system, IP address, app performance logs, crash reports, and behavior patterns within the application. If you grant permission, we may also collect GPS-based location data to assist with accurate trip suggestions, route management, and safety features. This information helps us understand how the Platform is being used and allows us to continuously optimize performance and security.

1.5 Optional Information
You may choose to provide additional information such as feedback, ratings, emergency contact details, or extra verification documents. Although optional, this information helps improve user trust, supports safety features, and enhances the overall user experience by enabling more personalized services and reliable interactions.

2. HOW WE USE YOUR INFORMATION

2.1 Service Provision
Your information is used to create, maintain, and manage your user account, ensuring you have full access to the Platform’s features. We use the data to match Car Owners with Drivers, assist in trip planning, and facilitate communication between users. This ensures a smooth, reliable, and efficient experience for all users.

2.2 Identity & Document Verification
To maintain a safe and transparent environment, your information is used to confirm your identity and validate any documents submitted. This includes verifying driving licenses, vehicle documents, and any government-issued identification. These checks help prevent fraudulent activity, ensure that all users are genuine, and build trust among the Platform community.

2.3 Safety & Compliance
We use your information to support various safety mechanisms, such as detecting unusual activities, enabling SOS features, handling emergency alerts, and assisting in the investigation of misuse or policy violations. Additionally, we may process data to comply with legal obligations, cooperate with regulatory authorities, and ensure that all activities on the Platform align with required safety standards.

2.4 Platform Improvement
User and technical data are analyzed to better understand usage behavior, identify system performance issues, and enhance existing features. This helps us introduce improvements, fix errors, develop new functionalities, and create a smoother and more intuitive user experience.

2.5 Communication
We use your contact information to send important notifications such as account verification codes, security alerts, trip confirmations, scheduling updates, and service-related announcements. These communications ensure you stay informed about relevant activities and updates on the Platform.

3. HOW YOUR INFORMATION IS SHARED

3.1 Law Enforcement & Legal Requirements
We may disclose your information to law enforcement agencies, government authorities, or regulatory bodies when required to comply with legal obligations. This includes situations involving criminal investigations, fraud prevention, court orders, or urgent safety concerns. Such disclosures are made only when legally mandated or essential for the protection of users or the public.

3.2 Internal Operational Purposes
Authorized members of our internal team may access your information when necessary for troubleshooting, customer support, service improvements, or ensuring compliance with internal policies. All internal access is limited, monitored, and granted strictly on a need-to-know basis.

3.3 No Sharing with Advertisers
We do not share, sell, or trade your personal information with advertising agencies, marketing companies, or any unrelated third parties without your explicit consent. Any promotional communication will be sent only if you opt in, giving you full control over how your data is used.

4. DATA SECURITY
We implement a wide range of industry-standard security practices to ensure that your personal information remains protected at all times. This includes the use of encryption technologies, secure data storage systems, firewalls, access controls, and continuous system monitoring. Only authorized personnel have access to sensitive information, and they are bound by strict confidentiality obligations. While we make every effort to safeguard your data, users should understand that no digital platform can guarantee complete security. We therefore encourage you to use strong passwords, avoid sharing login credentials, and secure your personal devices.

5. DATA RETENTION
Your personal information is stored only for as long as it is necessary to provide services, fulfill legal requirements, resolve disputes, or prevent misconduct. When your account is deleted, we follow secure deletion procedures or anonymize your data so it can no longer be linked to you. However, certain information may be retained for extended periods if required by law or regulatory guidelines.

6. USER RIGHTS
You have the right to request access to the personal information we hold about you, ask for corrections to inaccurate or incomplete data, or request the deletion of your information subject to legal requirements. You may also withdraw consent for optional data processing or request a copy of your data in a structured format where applicable. To exercise these rights, you may contact us at [Support Email].

7. COOKIES & TRACKING TECHNOLOGIES
We use cookies, tracking pixels, and similar technologies to improve user experience by remembering preferences, simplifying navigation, analyzing trends, and enhancing app performance. Cookies also help us detect potential issues and improve stability. You may disable cookies through your device settings, but doing so may impact the functionality and responsiveness of certain features.

8. CHILDREN’S PRIVACY
The Platform is designed exclusively for individuals aged 18 and above. We do not knowingly collect or store information from minors. If we become aware that data belonging to a minor has been collected, we will promptly delete that information and restrict access to the account.

9. CHANGES TO THIS PRIVACY POLICY
We may update or revise this Privacy Policy from time to time to reflect changes in legal requirements, business operations, or technological advancements. Updated versions will be published with a revised “Last Updated” date. Your continued use of the Platform after changes are posted constitutes acceptance of the updated policy.`
    },
    {
        id: 11,
        title: "11. ACCOUNT SUSPENSION & TERMINATION",
        icon: "ban-outline",
        content: `The Platform reserves the right to suspend, restrict, or permanently terminate any user account to ensure the safety, integrity, and proper functioning of the service. Account actions may be taken at the Platform’s sole discretion under the following circumstances:

11.1 Fake or Misleading Information
If a user provides incorrect, falsified, or intentionally misleading details such as false identity information, inaccurate driving credentials, or manipulated vehicle data—the Platform may take immediate action. Accuracy of user information is critical for maintaining trust and safety among all participants.

11.2 Unsafe or Irresponsible Driving
In cases where a Driver engages in behavior that puts themselves, the Car Owner, or the general public at risk such as reckless driving, over speed, or operating the vehicle under unsafe conditions the Platform may suspend or terminate the account. The Platform prioritizes the safety of all individuals using the service.

11.3 Misconduct or Inappropriate Behavior
Any form of misconduct, including harassment, abusive language, threatening behavior, discrimination, or disrespectful interactions with other users, may lead to account suspension. The Platform upholds a zero Tolerance policy to ensure a respectful and safe community environment.

11.4 Fraudulent or Deceptive Activity
Engaging in any form of fraud such as manipulating the booking system, impersonation, or exploitation of the Platform for personal gain will result in strict action, including permanent removal. Fraudulent actions compromise the trust and fairness of the platform ecosystem.

11.5 Non-Compliance with Terms & Policies
Failure to adhere to the Platform’s Terms & Conditions, safety guidelines, verification standards, operational rules, or any applicable laws may lead to temporary or permanent account action. Users are expected to follow all policies consistently to maintain eligibility.

11.6 Violation of Community Guidelines
The Platform maintains community standards that promote responsible behavior, mutual respect, and safe collaboration. Violation of these standards whether through behavior, communication, or misuse of platform features may result in account suspension.

11.7 User-Initiated Account Deletion
Users may choose to permanently delete their account at any time by submitting a request through the Platform. Upon confirmation, all associated personal data will be removed or anonymized in accordance with the Platform’s data retention and privacy policies, except where retention is legally required.`
    },
    {
        id: 12,
        title: "12. DISPUTE RESOLUTION",
        icon: "chatbubbles-outline",
        content: `The Platform encourages transparent communication and responsible behavior between users. However, in cases where disagreements or conflicts arise, the following dispute resolution framework applies:

12.1 User-to-User Dispute Responsibility
Any dispute, misunderstanding, or conflict that occurs between a Car Owner and a Driver such as disagreements regarding trip details, vehicle handling, punctuality, or general conduct must first be addressed and resolved directly between the involved parties. The Platform does not assume responsibility for mediating or deciding the outcome of such disputes, as the relationship is based on mutual understanding and voluntary interaction.

12.2 Platform’s Role as a Neutral Facilitator
The Platform functions solely as a digital medium that connects Car Owners and Driver. It does not participate in negotiations, arbitration, or settlement of disagreements. The Platform does not guarantee outcomes, verify statements, or enforce any agreements between users. Its role is limited to providing tools for communication and trip coordination.

12.3 Escalation to Customer Support
In situations where the dispute cannot be resolved amicably between the parties, users may contact the Platform’s customer support team. Customer support may provide general guidance, clarify platform rules, and review relevant account activity. However, the team’s assistance is limited to advisory support and does not include making binding decisions or enforcing resolutions.

12.4 Escalation to Local Authorities
For serious issues such as fraud, harassment, threats, property damage, or any behavior constituting a violation of law, users are strongly advised to escalate the matter to competent local authorities. The Platform may cooperate with law enforcement by providing necessary information, subject to legal requirements and applicable privacy policies.

12.5 No Liability for Outcomes
The Platform is not liable for the results of any user-to-user dispute or for actions taken by customer support or local authorities. All obligations, responsibilities, and resolutions remain strictly between the Car Owner and Driver.`
    },
    {
        id: 13,
        title: "13. LEGAL COMPLIANCE",
        icon: "book-outline",
        content: `All users of the Platform, including both Car Owners and Drivers, are required to adhere to all applicable laws, rules, and regulations governing road usage and transportation. By using the Platform, users acknowledge and agree to comply with the following legal obligations:

13.1 Compliance with National Road Transport Laws
Users must strictly follow the provisions of the Road Transport Act and any other central laws governing motor vehicle operation, road safety, and transportation standards. This includes maintaining valid driving permissions, adhering to lawful road conduct, and ensuring that vehicle usage aligns with regulatory requirements. Users are responsible for understanding and complying with these national laws at all times.

13.2 Compliance with Motor Vehicle Rules
All vehicles and drivers participating through the Platform must comply with the Motor Vehicles Rules applicable within India, including but not limited to regulations regarding vehicle fitness, pollution certification, insurance validity, and permissible vehicle usage. Users must ensure that the vehicle is legally compliant before initiating or accepting a trip. The Platform does not verify the authenticity or legality of user-submitted documents and relies solely on the users' declarations.

13.3 Adherence to Local & State Traffic Laws
Users must follow all state-specific and local traffic regulations applicable in the region where the travel occurs. This includes compliance with rules related to speed limits, parking restrictions, lane discipline, road signage, and local transport norms. Users are solely liable for any fines, penalties, or legal action resulting from violations of local traffic laws during the course of the journey.

13.4 Compliance with Safety Regulations
Users must follow all road safety regulations mandated by law, including wearing seat belts, avoiding the use of mobile phones while driving, and ensuring the vehicle meets safety standards. Any legally required safety measures, such as carrying valid documentation, maintaining vehicle fitness, or ensuring safe conduct while on the road, must be fulfilled by the respective user.

13.5 User’s Responsibility for Legal Violations
Any violation of national, state, or local laws committed by either the Car Owner or the Driver during the use of the Platform is solely the responsibility of the individual involved. The Platform does not assume liability for legal breaches, penalties, or enforcement actions taken by authorities arising from user behavior.

13.6 Cooperation with Authorities
In the event of an investigation, complaint, or legal requirement, the Platform may share user information with relevant authorities, as permitted under applicable law. Users agree to cooperate with lawful requests made by enforcement or regulatory bodies.`
    },
    {
        id: 14,
        title: "14. INDEMNITY CLAUSE",
        icon: "umbrella-outline",
        content: `14.1 General Indemnification
By using the Platform, all Users (including Car Owners and Drivers) agree to fully indemnify, defend, and hold harmless the Platform, its owners, affiliates, employees, and service partners from any form of loss, claim, damage, liability, penalty, or legal expense that arises directly or indirectly from their actions, behavior, or use of the vehicle. This includes, but is not limited to, consequences resulting from driving practices, route decisions, failure to follow laws, or misuse of the services offered through the Platform.

14.2 Indemnity for Losses
Users accept complete responsibility for any financial or material loss caused due to their conduct or vehicle-related activities. Such losses may include vehicle damage, property damage, loss of personal items, or disruptions caused to other Users or third parties. The Platform shall not be liable for compensating or recovering such losses under any circumstances.

14.3 Indemnity for Claims
If any third party raises a complaint, dispute, or legal claim against the Platform due to the User’s behavior or their involvement in a trip arranged through the Platform, the User shall be solely accountable for resolving the matter. The User agrees to bear all obligations arising from such claims without involving or imposing liability on the Platform.

14.4 Indemnity for Damages
Users must compensate for any direct, indirect, incidental, or consequential damages that occur due to their negligence, wrongful act, non-compliance, or violation of the Terms and Conditions. This includes damages caused during vehicle operation, interaction with other Users, or actions that breach safety guidelines or applicable laws.

14.5 Indemnity for Legal Expenses
In the event the Platform faces any legal proceedings, notices, regulatory investigations, or compliance related obligations due to the User’s actions, the User agrees to reimburse all legal fees, attorney charges, administrative costs, and any associated expenses incurred by the Platform. This responsibility applies regardless of whether the legal action is initiated by another User, a third party, or a government authority.

14.6 Independent Responsibility
Users acknowledge that the Platform acts solely as a facilitator connecting Car Owners and Drivers. All risks, liabilities, and disputes arising from the trip are solely between the respective Users. The Platform shall not be held responsible for validating the User’s conduct, travel decisions, vehicle condition, or driving capability. Users must therefore indemnify the Platform from any issue linked to their personal choices or operational behavior.`
    },
    {
        id: 15,
        title: "15. MODIFICATION OF TERMS",
        icon: "sync-outline",
        content: `15.1 Right to Modify
The Platform reserves the full right to revise, update, amend, or replace these Terms and Conditions at any time, based on operational requirements, legal obligations, regulatory changes, security enhancements, or improvements to user experience. Such modifications may include changes to policies, features, eligibility requirements, usage guidelines, or any other operational aspect of the Platform. Users acknowledge that these updates are essential to maintain the safe and efficient functioning of the service.

15.2 Notification of Changes
The Platform may notify Users of any changes through in-app notifications, email alerts, SMS messages, updated policy pages, or any other communication method deemed appropriate. However, it remains the User’s responsibility to regularly review the Terms to stay informed about the latest updates. The Platform shall not be held liable if a User fails to review the revised Terms.

15.3 Acceptance of Updated Terms
A User’s continued access to or use of the Platform after the revised Terms come into effect will automatically be considered as their full acceptance and agreement to the updated Terms. If a User does not agree with the modified Terms, they are required to discontinue the use of the Platform immediately. Any continued usage will be interpreted as voluntary acceptance of all changes.

15.4 Effective Date of Modifications
Unless explicitly stated otherwise, all modifications to the Terms and Conditions shall become effective immediately upon being published on the Platform. Users agree that the Platform is not obligated to seek prior approval or consent before implementing updates.`
    },
];



export default function PrivacyPolicyScreen(props) {
    const navigation = useNavigation();
    const { theme, themeName } = useTheme();
    const [isChecked, setIsChecked] = useState(false);

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: theme.background }]}>
            <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Terms & Conditions</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Dynamic StatusBar */}
            <StatusBar
                barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            {renderHeader()}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Intro Section */}
                <Text style={[styles.introText, { color: theme.textSecondary }]}>
                    Please read these terms carefully before using the Drive share platform. These terms apply to all drivers, passengers, and vehicle owners.
                </Text>

                {/* Dynamic Sections Loop */}
                {termsData.map((item) => (
                    <View key={item.id} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name={item.icon} size={22} color={theme.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                        </View>
                        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                            {item.content}
                        </Text>
                    </View>
                ))}

                {/* Bottom Padding for Footer */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setIsChecked(!isChecked)}
                >
                    <View style={[
                        styles.checkbox,
                        { borderColor: theme.textSecondary },
                        isChecked && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}>
                        {isChecked && <Ionicons name="checkmark" size={14} color={theme.textPrimary} />}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>I have read and agree to the terms</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[
                        styles.declineButton,
                        { backgroundColor: theme.card, borderColor: theme.border }
                    ]}>
                        <Text style={[styles.declineText, { color: theme.textPrimary }]}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.acceptButton,
                            { backgroundColor: theme.primary },
                            !isChecked && styles.disabledButton
                        ]}
                        disabled={!isChecked}
                    >
                        <Text style={[styles.acceptText, { color: theme.textPrimary }]}>Accept & Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    iconButton: {
        position: 'absolute',
        left: SIZES.padding,
        zIndex: 1,
    },
    closeText: {
        fontSize: SIZES.body,
    },
    scrollContent: {
        paddingHorizontal: SIZES.padding,
    },
    lastUpdated: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 5,
        letterSpacing: 1,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    introText: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: SIZES.body,
        lineHeight: 20,
        marginBottom: 30,
    },
    // Sections
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1,
    },
    bodyText: {
        fontSize: SIZES.body,
        lineHeight: 22,
        paddingLeft: 2,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SIZES.padding,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        borderTopWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxLabel: {
        fontSize: SIZES.body,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    declineButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        borderWidth: 1,
    },
    declineText: {
        fontWeight: '600',
        fontSize: SIZES.h3,
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: SIZES.radius,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    acceptText: {
        fontWeight: '600',
        fontSize: SIZES.h3,
    },
});