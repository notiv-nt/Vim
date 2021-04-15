import { TextObjectMovement } from '../../textobject/textobject';
import { RegisterAction } from '../base';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { IMovement, BaseMovement } from '../baseMotion';
import { configuration } from '../../configuration/configuration';
import { ChangeOperator } from '../operator';
import { WordType } from '../../textobject/word';
import { Position } from 'vscode';

abstract class CamelCaseBaseMovement extends BaseMovement {
  public doesActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.couldActionApply(vimState, keysPressed);
  }
}

abstract class CamelCaseTextObjectMovement extends TextObjectMovement {
  public doesActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]) {
    return configuration.camelCaseMotion.enable && super.couldActionApply(vimState, keysPressed);
  }
}

// based off of `MoveWordBegin`
@RegisterAction
class MoveCamelCaseWordBegin extends CamelCaseBaseMovement {
  // NOTIV
  keys = ['≤']; // keys = ['<leader>', 'w'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (
      !configuration.changeWordIncludesWhitespace &&
      vimState.recordedState.operator instanceof ChangeOperator
    ) {
      // TODO use execForOperator? Or maybe dont?

      // See note for w
      return position.nextWordEnd(vimState.document, { wordType: WordType.CamelCase }).getRight();
    } else {
      return position.nextWordStart(vimState.document, { wordType: WordType.CamelCase });
    }
  }
}

// based off of `MoveWordEnd`
@RegisterAction
class MoveCamelCaseWordEnd extends CamelCaseBaseMovement {
  // NOTIV
  keys = ['≥']; // keys = ['<leader>', 'e'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.nextWordEnd(vimState.document, { wordType: WordType.CamelCase });
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    const end = position.nextWordEnd(vimState.document, { wordType: WordType.CamelCase });

    return new Position(end.line, end.character + 1);
  }
}

// based off of `MoveBeginningWord`
@RegisterAction
class MoveBeginningCamelCaseWord extends CamelCaseBaseMovement {
  // NOTIV
  keys = ['≈']; // keys = ['<leader>', 'b'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.prevWordStart(vimState.document, { wordType: WordType.CamelCase });
  }
}

// based off of `SelectInnerWord`
@RegisterAction
class SelectInnerCamelCaseWord extends CamelCaseTextObjectMovement {
  modes = [Mode.Normal, Mode.Visual];
  keys = ['i', '<leader>', 'w'];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = vimState.document.lineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
      start = position.prevWordEnd(vimState.document, { wordType: WordType.CamelCase }).getRight();
      stop = position
        .nextWordStart(vimState.document, { wordType: WordType.CamelCase })
        .getLeftThroughLineBreaks();
    } else {
      start = position.prevWordStart(vimState.document, {
        wordType: WordType.CamelCase,
        inclusive: true,
      });
      stop = position.nextWordEnd(vimState.document, {
        wordType: WordType.CamelCase,
        inclusive: true,
      });
    }

    if (
      vimState.currentMode === Mode.Visual &&
      !vimState.cursorStopPosition.isEqual(vimState.cursorStartPosition)
    ) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorStopPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position
            .prevWordEnd(vimState.document, { wordType: WordType.CamelCase })
            .getRight();
        } else {
          stop = position.prevWordStart(vimState.document, {
            wordType: WordType.CamelCase,
            inclusive: true,
          });
        }
      }
    }

    return {
      start,
      stop,
    };
  }
}
