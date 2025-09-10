import {ReactNode, useState} from 'react';
import {Separator} from '@/components/ui/separator.tsx';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs.tsx';
import {LucideProps} from 'lucide-react';
import * as react from 'react';

type IconElement = react.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & react.RefAttributes<SVGSVGElement>>;

const TAB_CLASS_NAME = [
  'bg-background text-foreground',
  'data-[state=active]:bg-foreground data-[state=active]:dark:bg-foreground',
  'data-[state=active]:text-background data-[state=active]:dark:text-background'
].join(' ');

type Props<Tabs extends Record<string, IconElement>> = {
  tabs: Tabs;
  tabExtends?: ReactNode;
  children: (tab: keyof Tabs) => ReactNode;
};

export default function CustomizedTabs<Tabs extends Record<string, IconElement>>({ tabs, tabExtends, children }: Props<Tabs>) {
  const [activeTab, setActiveTab] = useState(Object.keys(tabs)[0]);

  return (
    <Tabs className="flex flex-col flex-1 w-full" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="bg-foreground/40 gap-2 sticky top-[3.25rem] z-40 self-center px-3 py-6">
        {Object.keys(tabs).map((key) => {
          const Icon = tabs[key];
          return (<TabsTrigger key={key} value={key} className={TAB_CLASS_NAME}><Icon /></TabsTrigger>);
        })}
        { Boolean(tabExtends) && <Separator orientation="vertical" className="bg-background/50 h-9" /> }
        { tabExtends }
      </TabsList>
      {Object.keys(tabs).map((key) => {
        return (<TabsContent value={key} className="bg-background rounded-lg p-2">
          {children(key)}
        </TabsContent>);
      })}
    </Tabs>
  );
}
