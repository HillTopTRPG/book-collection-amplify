import { Amplify } from 'aws-amplify';
import ApplicationControlLayer from '@/App/ApplicationControlLayer';
import AwsLayer from '@/App/AwsLayer/AwsLayer.tsx';
import { Toaster } from '@/components/ui/toaster.tsx';
import Pages from '@/pages';
import config from '../../amplify_outputs.json';

Amplify.configure(config);

export default function App() {
  return (
    <ApplicationControlLayer>
      <AwsLayer>
        <Pages />
        <Toaster />
      </AwsLayer>
    </ApplicationControlLayer>
  );
}
