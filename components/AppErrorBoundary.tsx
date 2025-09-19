import React from 'react';
import { View, Text, Button } from 'react-native';

export class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {err?: any}> {
  constructor(p:any){ super(p); this.state = { err: undefined }; }
  static getDerivedStateFromError(err:any){ return { err }; }
  render(){
    if (this.state.err) {
      return (
        <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24}}>
          <Text style={{fontSize:20, fontWeight:'600', marginBottom:12}}>Noget gik galt</Text>
          <Text selectable style={{opacity:0.8, marginBottom:16}}>
            {String(this.state.err?.message || this.state.err)}
          </Text>
          <Button title="Genindlæs" onPress={()=>location.reload()} />
        </View>
      );
    }
    return this.props.children as any;
  }
}
