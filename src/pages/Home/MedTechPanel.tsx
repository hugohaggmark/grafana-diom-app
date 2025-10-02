import React from 'react';
import { MedTechPanelState } from 'types';
import { SceneComponentProps, SceneObjectBase } from '@grafana/scenes';
import { ErrorBoundary, ErrorWithStack } from '@grafana/ui';
import { CornerStonePanel } from './CornerStonePanel';

export class MedTechPanel extends SceneObjectBase<Partial<MedTechPanelState>> {
  static Component = MedTechPanelRenderer;
}

function MedTechPanelRenderer({ model }: SceneComponentProps<MedTechPanel>) {
  const state = model.useState();
  return (
    <ErrorBoundary>
      {({ error, errorInfo }) => {
        if (error) {
          return <ErrorWithStack error={error} title="An unexpected error happened" errorInfo={errorInfo} />;
        }

        return (
          <>
            <CornerStonePanel {...state} orientation="axial" />
            <CornerStonePanel {...state} orientation="sagittal" />
            <CornerStonePanel {...state} orientation="coronal" />
          </>
        );
      }}
    </ErrorBoundary>
  );
}
