import { List } from "antd";
import VirtualList, { ListRef } from "rc-virtual-list";
import { useEffect, useRef } from "react";

export interface DataItem {
  key: string;
  text: string;
}

const contentHeight = 37;

export default function VirtualizationList(props: { data: DataItem[] }) {
  const { data } = props;
  const vList = useRef<ListRef>(null);

  useEffect(() => {
    if (vList.current) {
      const vContent = vList.current.nativeElement.children[0].children[0]
      vList.current.scrollTo(vContent.scrollHeight)
    }
  }, [data.length]);

  return (
    <List bordered>
      <VirtualList
        ref={vList}
        data={data}
        height={300}
        itemHeight={contentHeight}
        itemKey="key"
      >
        {(item: DataItem) => (
          <List.Item key={item.key}>
            <div>[{item.key}] {item.text}</div>
          </List.Item>
        )}
      </VirtualList>
    </List>
  );
}
