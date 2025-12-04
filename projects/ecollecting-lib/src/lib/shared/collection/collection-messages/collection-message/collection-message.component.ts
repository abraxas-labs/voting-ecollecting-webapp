/**
 * (c) Copyright by Abraxas Informatik AG
 *
 * For license information see LICENSE file.
 */

import { Component, Input } from '@angular/core';
import { CollectionMessage } from '../../../models/collection-message.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'vo-ecol-collection-message',
  imports: [DatePipe],
  templateUrl: './collection-message.component.html',
  styleUrl: './collection-message.component.scss',
})
export class CollectionMessageComponent {
  @Input({ required: true })
  public message!: CollectionMessage;
}
