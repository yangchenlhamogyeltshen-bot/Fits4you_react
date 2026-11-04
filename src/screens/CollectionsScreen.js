import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Screen, PageTitle, Txt } from '../components/UI';
import { useTheme } from '../theme';
import LooksScreen from './LooksScreen';
import CapsuleScreen from './CapsuleScreen';
import WashingScreen from './WashingScreen';

const TABS = ['Looks', 'Essentials', 'Washing'];

export default function CollectionsScreen({ navigation }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState('Looks');

  return (
    <Screen>
      <PageTitle title="Collections" subtitle="Looks, essentials and laundry" />

      <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.primaryContainer, borderRadius: 24, padding: 4 }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20,
                backgroundColor: tab === t ? colors.primary : 'transparent',
              }}
            >
              <Txt bold size={14} color={tab === t ? colors.onPrimary : colors.primary}>{t}</Txt>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'Looks' && <LooksScreen navigation={navigation} embedded />}
        {tab === 'Essentials' && <CapsuleScreen navigation={navigation} embedded />}
        {tab === 'Washing' && <WashingScreen navigation={navigation} embedded />}
      </View>
    </Screen>
  );
}